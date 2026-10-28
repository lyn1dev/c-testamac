import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { TOPIC_CATALOG } from '../content/catalog'
import { TOPIC_BY_ID } from '../content/index'
import { db } from '../db'
import { estimateScores, type Estimate } from '../practice/estimate'
import { weakestTopics } from '../practice/mastery'
import { saveSetting, useSettings } from '../settings'
import { Btn, Card, LinkBtn, Page, STATUS_STYLE } from '../ui/bits'
import { useDueCount, useMastery } from '../ui/hooks'

const TOPIC_LEVELS = Object.fromEntries(TOPIC_CATALOG.map((t) => [t.id, t.level]))

function Score({ label, e }: { label: string; e: Estimate }) {
  return (
    <div>
      <p className="text-sm text-stone-500">Estimated {label} C-test</p>
      <p className="text-4xl font-semibold">{e.value === null ? '—' : `${e.value}%`}</p>
      <p className="text-xs text-stone-500">
        {e.basis === 'texts'
          ? `from your last ${e.n} unassisted text${e.n === 1 ? '' : 's'}`
          : e.basis === 'grammar'
            ? 'rough, from grammar mastery — do a C-test'
            : 'no data yet'}
      </p>
    </div>
  )
}

export function Dashboard() {
  const settings = useSettings()
  const mastery = useMastery()
  const due = useDueCount()
  const results = useLiveQuery(() => db.results.orderBy('at').reverse().toArray())
  const nav = useNavigate()
  const [minutes, setMinutes] = useState<number | null>(null)
  if (!settings || !mastery || !results) return null
  const mins = minutes ?? settings.sessionMinutes
  const est = estimateScores(results, mastery, TOPIC_LEVELS)
  const weakest = weakestTopics(mastery, 5)

  return (
    <Page title="Today">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="md:col-span-2">
          <h2 className="font-semibold">Start today's session</h2>
          <p className="mt-1 text-sm text-stone-600">
            Reviews, one grammar topic, C-tests and your weakest area — fitted to your time.
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {[15, 30, 45, 60].map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMinutes(m)
                  void saveSetting('sessionMinutes', m)
                }}
                className={`rounded-lg border px-3 py-1.5 text-sm ${m === mins ? 'border-indigo-500 bg-indigo-50' : 'border-stone-300'}`}
              >
                {m} min
              </button>
            ))}
            <Btn kind="primary" onClick={() => nav(`/session?min=${mins}`)}>
              Start today's session
            </Btn>
          </div>
        </Card>
        <Card>
          <h2 className="font-semibold">Due reviews</h2>
          <p className="mt-1 text-4xl font-semibold">{due ?? 0}</p>
          <div className="mt-3 flex gap-2">
            <LinkBtn to="/review">Review</LinkBtn>
            <LinkBtn to="/review?rapid=1">Rapid mode</LinkBtn>
          </div>
        </Card>
        <Card>
          <Score label="B1" e={est.B1} />
        </Card>
        <Card>
          <Score label="B2" e={est.B2} />
        </Card>
        <Card>
          <h2 className="font-semibold">Exam simulation</h2>
          <p className="mt-1 text-sm text-stone-600">
            {settings.examTexts} texts × {Math.round(settings.secondsPerText / 60)} min, no lookups, no feedback until the end.
          </p>
          <div className="mt-3 flex gap-2">
            <LinkBtn to="/exam" primary>
              Start exam
            </LinkBtn>
            <LinkBtn to="/cram">Cram a level</LinkBtn>
          </div>
        </Card>
        <Card className="md:col-span-2">
          <h2 className="mb-2 font-semibold">Weakest topics</h2>
          {weakest.length === 0 ? (
            <p className="text-sm text-stone-500">Nothing weak yet — practise or take a C-test to find out.</p>
          ) : (
            <ul className="space-y-1">
              {weakest.map((id) => (
                <li key={id} className="flex items-center justify-between text-sm">
                  <Link to={`/grammar/${id}`} className="text-indigo-700 hover:underline">
                    {TOPIC_BY_ID.get(id)?.title ?? id}
                  </Link>
                  <span className="text-stone-500">{Math.round(mastery[id].score * 100)}%</span>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <h2 className="mb-2 font-semibold">Mastery</h2>
          <div className="flex flex-wrap gap-1">
            {TOPIC_CATALOG.map((t) => (
              <Link
                key={t.id}
                to={`/grammar/${t.id}`}
                title={`${t.level} · ${t.title}`}
                className={`h-4 w-4 rounded-sm border ${STATUS_STYLE[mastery[t.id].status]}`}
              />
            ))}
          </div>
          <Link to="/grammar" className="mt-2 inline-block text-sm text-indigo-700 hover:underline">
            Open the grammar map →
          </Link>
        </Card>
        <Card className="md:col-span-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold">Recent C-tests</h2>
            <Link to="/placement" className="text-sm text-stone-500 hover:underline">
              Retake placement
            </Link>
          </div>
          {results.length === 0 ? (
            <p className="text-sm text-stone-500">None yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100 text-sm">
              {results.slice(0, 8).map((r) => (
                <li key={r.id} className="flex justify-between py-1.5">
                  <span>
                    <span className="mr-2 rounded bg-stone-100 px-1.5 text-xs">{r.level}</span>
                    {r.title} <span className="text-stone-400">· {r.mode}</span>
                  </span>
                  <span className={r.assisted ? 'text-stone-400' : ''}>
                    {r.correct}/{r.total}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </Page>
  )
}
