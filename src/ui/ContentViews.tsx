import { Link } from 'react-router-dom'
import { conjugate, PERSONS, TENSE_LABELS, TENSES } from '../content/conjugate'
import { TABLE_BY_ID } from '../content/index'
import type { GrammarTable, Topic, Verb } from '../content/types'
import { Rich } from './bits'

export function TableGrid({ table, compact }: { table: GrammarTable; compact?: boolean }) {
  const hl = new Set((table.highlight ?? []).map(([r, c]) => `${r},${c}`))
  return (
    <div className="overflow-x-auto">
      <table className={`border-collapse ${compact ? 'text-xs' : 'text-sm'}`}>
        <thead>
          <tr>
            <th />
            {table.cols.map((c) => (
              <th key={c} className="border-b border-stone-300 px-2 py-1 text-left font-medium text-stone-500">
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
                <td
                  key={c}
                  className={`border border-stone-200 px-2 py-1 font-mono ${hl.has(`${r},${c}`) ? 'bg-amber-100' : ''}`}
                >
                  {table.cells[r][c]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function TableCard({ table, compact }: { table: GrammarTable; compact?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold">{table.title}</h3>
        {!compact && (
          <Link to={`/tables/${table.id}`} className="text-sm text-indigo-600 hover:underline">
            drill this table →
          </Link>
        )}
      </div>
      <p className="text-sm text-stone-700">
        <Rich text={table.pattern} />
      </p>
      <TableGrid table={table} compact={compact} />
      {table.tricks.length > 0 && (
        <ul className="list-disc pl-5 text-sm text-stone-700">
          {table.tricks.map((t) => (
            <li key={t}>
              <Rich text={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function LessonView({ topic, compact }: { topic: Topic; compact?: boolean }) {
  const h = compact ? 'mt-4 mb-1 text-sm font-semibold uppercase text-stone-500' : 'mt-6 mb-2 text-lg font-semibold'
  return (
    <div className={compact ? 'text-sm' : ''}>
      <p className="text-stone-600 italic">{topic.summary}</p>
      <div className="mt-3 space-y-2">
        {topic.rule.map((p, i) => (
          <p key={i}>
            <Rich text={p} />
          </p>
        ))}
      </div>
      {topic.tables.map((id) => {
        const t = TABLE_BY_ID.get(id)
        return t ? (
          <div key={id} className="mt-4">
            <TableCard table={t} compact={compact} />
          </div>
        ) : null
      })}
      <h3 className={h}>Tricks</h3>
      <ul className="list-disc space-y-1 pl-5">
        {topic.tricks.map((t) => (
          <li key={t}>
            <Rich text={t} />
          </li>
        ))}
      </ul>
      <h3 className={h}>Traps</h3>
      <ul className="list-disc space-y-1 pl-5">
        {topic.traps.map((t) => (
          <li key={t}>
            <Rich text={t} />
          </li>
        ))}
      </ul>
      <h3 className={h}>Examples</h3>
      <ul className="space-y-1">
        {topic.examples.map((e) => (
          <li key={e.de}>
            <span className="font-medium">{e.de}</span> <span className="text-stone-500">— {e.en}</span>
            {e.note && <span className="block text-xs text-stone-500">{e.note}</span>}
          </li>
        ))}
      </ul>
      <h3 className={h}>In C-tests</h3>
      <p>
        <Rich text={topic.inCTests} />
      </p>
    </div>
  )
}

export function VerbView({ verb }: { verb: Verb }) {
  return (
    <div className="space-y-3 text-sm">
      <p>
        <span className="text-lg font-semibold">{verb.inf}</span> <span className="text-stone-500">— {verb.en}</span>
      </p>
      <p className="font-mono">
        {verb.inf} · {verb.praet}
        {verb.sep ? ` ${verb.sep}` : ''} · {verb.aux === 'both' ? 'hat/ist' : verb.aux === 'sein' ? 'ist' : 'hat'} {verb.p2}
      </p>
      <p className="text-stone-500">
        {verb.kind}
        {verb.group ? ` · pattern ${verb.group}` : ''}
      </p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th />
              {TENSES.map((t) => (
                <th key={t} className="px-2 py-1 text-left font-medium text-stone-500">
                  {TENSE_LABELS[t]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERSONS.map((p, i) => (
              <tr key={p}>
                <th className="pr-2 text-left font-medium text-stone-500">{p}</th>
                {TENSES.map((t) => (
                  <td key={t} className="border border-stone-200 px-2 py-1 font-mono">
                    {conjugate(verb, t)[i]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
