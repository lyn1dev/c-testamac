import { useEffect, useMemo, useRef, useState } from 'react'
import { TABLE_BY_ID, TOPIC_BY_ID, VERB_BY_INF } from '../content/index'
import { search, type Hit } from '../content/search'
import { STRATEGIES } from '../content/strategies'
import { Rich } from './bits'
import { LessonView, TableCard, VerbView } from './ContentViews'
import { closeReference, noteLookup, useLookup } from './lookup'

const KIND_LABEL: Record<Hit['kind'], string> = {
  topic: 'Lesson',
  table: 'Table',
  verb: 'Verb',
  trick: 'Trick',
  strategy: 'Strategy',
}

function Detail({ hit }: { hit: Hit }) {
  if (hit.kind === 'topic' || hit.kind === 'trick') {
    const t = TOPIC_BY_ID.get(hit.id)
    return t ? (
      <div>
        <h2 className="mb-2 text-lg font-semibold">{t.title}</h2>
        <LessonView topic={t} compact />
      </div>
    ) : null
  }
  if (hit.kind === 'table') {
    const t = TABLE_BY_ID.get(hit.id)
    return t ? <TableCard table={t} compact /> : null
  }
  if (hit.kind === 'verb') {
    const v = VERB_BY_INF.get(hit.id)
    return v ? <VerbView verb={v} /> : null
  }
  const s = STRATEGIES.find((x) => x.id === hit.id)
  return s ? (
    <div className="text-sm">
      <h2 className="mb-2 text-lg font-semibold">{s.title}</h2>
      <p>{s.text}</p>
      {s.example && <p className="mt-2 font-mono text-stone-600">{s.example}</p>}
    </div>
  ) : null
}

export function ReferencePanel() {
  const { open, hit, locked, activity } = useLookup()
  const [q, setQ] = useState('')
  const [sel, setSel] = useState(0)
  const input = useRef<HTMLInputElement>(null)
  const hits = useMemo(() => search(q), [q])

  useEffect(() => {
    if (open) setTimeout(() => input.current?.select(), 0)
  }, [open])
  useEffect(() => setSel(0), [q])

  if (!open) return null
  if (locked) {
    return (
      <aside className="fixed inset-y-0 right-0 z-40 w-96 border-l border-stone-200 bg-white p-6 shadow-xl">
        <p className="font-medium">Reference is off during the exam simulation.</p>
        <button className="mt-4 text-sm text-indigo-600" onClick={closeReference}>
          Close (Esc)
        </button>
      </aside>
    )
  }

  const choose = (h: Hit) => noteLookup(h)

  return (
    <aside
      className="fixed inset-y-0 right-0 z-40 flex w-[34rem] max-w-full flex-col border-l border-stone-200 bg-white shadow-xl"
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          e.stopPropagation()
          closeReference()
        }
      }}
    >
      <div className="border-b border-stone-200 p-3">
        <input
          ref={input}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') setSel((s) => Math.min(s + 1, hits.length - 1))
            if (e.key === 'ArrowUp') setSel((s) => Math.max(s - 1, 0))
            if (e.key === 'Enter' && hits[sel]) choose(hits[sel])
          }}
          placeholder="Search topics, tables, tricks, verbs (any form: ging, dessen, …)"
          className="w-full rounded-lg border border-stone-300 px-3 py-2"
        />
        <div className="mt-1 flex justify-between text-xs text-stone-500">
          <span>{activity ? 'Lookups during practice are tracked and not counted toward mastery.' : 'Ctrl+K toggles · Esc closes'}</span>
          <button onClick={closeReference}>close</button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1">
        {q && (
          <ul className="w-48 shrink-0 overflow-y-auto border-r border-stone-200 text-sm">
            {hits.map((h, i) => (
              <li key={`${h.kind}:${h.id}:${h.title}`}>
                <button
                  onClick={() => choose(h)}
                  className={`block w-full px-3 py-2 text-left ${i === sel ? 'bg-indigo-50' : 'hover:bg-stone-50'}`}
                >
                  <span className="block text-[10px] uppercase text-stone-400">{KIND_LABEL[h.kind]}</span>
                  <span className="line-clamp-2">{h.title}</span>
                </button>
              </li>
            ))}
            {hits.length === 0 && <li className="p-3 text-stone-500">No match</li>}
          </ul>
        )}
        <div className="min-w-0 flex-1 overflow-y-auto p-4">
          {hit ? (
            <Detail hit={hit} />
          ) : (
            <p className="text-sm text-stone-500">
              <Rich text="Type to search. Try **ging**, **dessen**, **Konjunktiv**, **wegen**." />
            </p>
          )}
        </div>
      </div>
    </aside>
  )
}
