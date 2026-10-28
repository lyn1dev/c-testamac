import { useMemo, useState } from 'react'
import { Link, Navigate, useParams } from 'react-router-dom'
import { matchesAny } from '../content/exercise'
import { TABLE_BY_ID, TABLES } from '../content/index'
import type { GrammarTable, Level } from '../content/types'
import { record } from '../db'
import { cellAnswers, cellItem } from '../practice/items'
import { shuffle, tableItems } from '../practice/pools'
import { Btn, Card, Page, Rich, useActivity } from '../ui/bits'
import { TableCard } from '../ui/ContentViews'
import { Drill } from '../ui/Drill'
import { lookupCount } from '../ui/lookup'

export function TablesPage() {
  return (
    <Page title="Tables">
      <p className="mb-4 text-sm text-stone-600">
        Learn the pattern, then fill each table from memory. Speed rounds drill cells in random order against the clock.
      </p>
      {(['A2', 'B1', 'B2'] as Level[]).map((level) => (
        <section key={level} className="mb-6">
          <h2 className="mb-2 font-semibold">{level === 'A2' ? 'A1–A2' : level}</h2>
          <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
            {TABLES.filter((t) => t.level === level).map((t) => (
              <Link key={t.id} to={`/tables/${t.id}`} className="rounded-lg border border-stone-200 bg-white p-3 text-sm hover:shadow">
                {t.title}
              </Link>
            ))}
          </div>
        </section>
      ))}
      <Link to="/verbs" className="text-indigo-700 hover:underline">
        Verb trainer (~200 verbs across all tenses) →
      </Link>
    </Page>
  )
}

function FillTable({ table, onDone }: { table: GrammarTable; onDone: () => void }) {
  const [vals, setVals] = useState<string[][]>(() => table.cells.map((r) => r.map(() => '')))
  const [checked, setChecked] = useState(false)
  const [startLookups] = useState(lookupCount)
  const fillable = (r: number, c: number) => !['', '–'].includes(table.cells[r][c].trim())
  const ok = (r: number, c: number) => matchesAny(cellAnswers(table.id, r, c), vals[r][c])
  const cells = table.cells.flatMap((row, r) => row.map((_, c) => [r, c] as const)).filter(([r, c]) => fillable(r, c))
  const score = cells.filter(([r, c]) => ok(r, c)).length

  const check = async () => {
    setChecked(true)
    const assisted = lookupCount() !== startLookups
    for (const [r, c] of cells) await record(cellItem(table.id, r, c), ok(r, c), { assisted, source: 'practice' })
  }

  return (
    <div>
      <div className="overflow-x-auto">
        <table className="border-collapse text-sm">
          <thead>
            <tr>
              <th />
              {table.cols.map((c) => (
                <th key={c} className="px-2 py-1 text-left font-medium text-stone-500">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, r) => (
              <tr key={row + r}>
                <th className="pr-3 text-left font-medium text-stone-500">{row}</th>
                {table.cols.map((_, c) => (
                  <td key={c} className="border border-stone-200 p-0.5">
                    {fillable(r, c) ? (
                      <input
                        value={vals[r][c]}
                        disabled={checked}
                        onChange={(e) => setVals((v) => v.map((x, i) => (i === r ? x.map((y, j) => (j === c ? e.target.value : y)) : x)))}
                        onKeyDown={(e) => e.key === 'Enter' && !checked && void check()}
                        className={`w-28 px-1 py-0.5 font-mono ${checked ? (ok(r, c) ? 'bg-emerald-100' : 'bg-rose-100') : ''}`}
                        autoComplete="off"
                        spellCheck={false}
                      />
                    ) : (
                      <span className="px-1 text-stone-400">–</span>
                    )}
                    {checked && !ok(r, c) && fillable(r, c) && (
                      <span className="block px-1 font-mono text-xs text-rose-700">{table.cells[r][c]}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex items-center gap-3">
        {!checked ? (
          <Btn kind="primary" onClick={() => void check()}>
            Check all
          </Btn>
        ) : (
          <>
            <span className="font-medium">
              {score}/{cells.length}
              {score === cells.length ? ' — perfect. Fill it again in a few days to make it stick.' : ' — wrong cells were added to reviews.'}
            </span>
            <Btn onClick={onDone}>Again</Btn>
          </>
        )}
      </div>
    </div>
  )
}

export function TablePage() {
  const { id = '' } = useParams()
  const table = TABLE_BY_ID.get(id)
  const [mode, setMode] = useState<'learn' | 'fill' | 'speed'>('learn')
  const [round, setRound] = useState(0)
  useActivity(mode === 'learn' ? null : `table:${id}`)
  const speedItems = useMemo(() => shuffle(tableItems(id)).concat(shuffle(tableItems(id))), [id, round])
  if (!table) return <Navigate to="/tables" replace />
  const go = (m: typeof mode) => {
    setMode(m)
    setRound((r) => r + 1)
  }
  return (
    <Page
      title={table.title}
      actions={
        <div className="flex gap-2">
          <Btn kind={mode === 'learn' ? 'primary' : 'plain'} onClick={() => go('learn')}>
            Learn
          </Btn>
          <Btn kind={mode === 'fill' ? 'primary' : 'plain'} onClick={() => go('fill')}>
            Fill from memory
          </Btn>
          <Btn kind={mode === 'speed' ? 'primary' : 'plain'} onClick={() => go('speed')}>
            Speed round (60 s)
          </Btn>
        </div>
      }
    >
      <Card>
        {mode === 'learn' && <TableCard table={table} compact={false} />}
        {mode === 'fill' && (
          <>
            <p className="mb-3 text-sm text-stone-600">
              <Rich text={table.pattern} />
            </p>
            <FillTable key={round} table={table} onDone={() => go('fill')} />
          </>
        )}
        {mode === 'speed' && (
          <Drill key={round} items={speedItems} source="practice" mode="rapid" timeLimit={60} />
        )}
      </Card>
    </Page>
  )
}
