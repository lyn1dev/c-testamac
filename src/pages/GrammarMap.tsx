import { Link } from 'react-router-dom'
import { TOPIC_CATALOG } from '../content/catalog'
import type { Level } from '../content/types'
import { Page, STATUS_STYLE } from '../ui/bits'
import { useMastery, useTopicStates } from '../ui/hooks'

const LEVELS: [Level, string][] = [
  ['A2', 'A1–A2 foundations'],
  ['B1', 'B1'],
  ['B2', 'B2'],
]

export function GrammarMap() {
  const mastery = useMastery()
  const states = useTopicStates()
  if (!mastery || !states) return null
  return (
    <Page title="Grammar map">
      <div className="mb-4 flex flex-wrap gap-2 text-xs">
        {(['new', 'weak', 'learning', 'strong', 'known'] as const).map((s) => (
          <span key={s} className={`rounded border px-2 py-0.5 ${STATUS_STYLE[s]}`}>
            {s === 'known' ? 'marked known' : s}
          </span>
        ))}
      </div>
      {LEVELS.map(([level, label]) => (
        <section key={level} className="mb-8">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-lg font-semibold">{label}</h2>
            <Link to={`/cram?level=${level}`} className="text-sm text-indigo-700 hover:underline">
              Cram {level} →
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
            {TOPIC_CATALOG.filter((t) => t.level === level).map((t) => {
              const m = mastery[t.id]
              const known = states[t.id]?.known && m.n === 0
              return (
                <Link
                  key={t.id}
                  to={`/grammar/${t.id}`}
                  className={`rounded-lg border p-3 text-sm hover:shadow ${STATUS_STYLE[known ? 'known' : m.status]}`}
                >
                  <span className="block font-medium">{t.title}</span>
                  <span className="text-xs opacity-75">
                    {m.n > 0 ? `${Math.round(m.score * 100)}% · ${m.n} answers` : known ? 'known' : 'not started'}
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      ))}
    </Page>
  )
}
