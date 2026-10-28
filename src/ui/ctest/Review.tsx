import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { askFollowUp, explainGaps } from '../../ai/tasks'
import { TOPIC_BY_ID } from '../../content/index'
import { STRATEGIES } from '../../content/strategies'
import { gradeGap, makeCTest, segments } from '../../ctest/gapper'
import { db, type CTestResult, type GapRecord } from '../../db'
import { gapItem } from '../../practice/items'
import { aiReady, useSettings } from '../../settings'
import { Btn, Card } from '../bits'
import { openReference } from '../lookup'

export function rebuild(r: CTestResult) {
  return makeCTest(r.text, { gaps: r.gaps.length, properNames: r.properNames })
}

function tally(gaps: GapRecord[]) {
  const scored = gaps.filter((g) => !g.reported)
  return { correct: scored.filter((g) => g.correct || g.accepted).length, total: scored.length }
}

function gapKey(r: CTestResult, i: number) {
  const ct = rebuild(r)
  const gap = ct.gaps[i]
  const [a] = ct.sentences[gap.sentence]
  return gapItem(r.gaps[i].sentence, { ...gap, start: gap.start - a, end: gap.end - a }).key
}

async function reportGap(r: CTestResult, i: number) {
  const gaps = r.gaps.map((g, j) => (j === i ? { ...g, reported: true } : g))
  const key = gapKey(r, i)
  await db.cards.delete(key)
  await db.attempts.where('key').equals(key).delete()
  const updated = { ...r, gaps, ...tally(gaps) }
  await db.results.put(updated)
  return updated
}

async function applyExplanations(r: CTestResult, letterCount: boolean, apiKey: string, model: string) {
  const ct = rebuild(r)
  const all = ct.gaps.map((g, i) => ({ n: i + 1, gap: g, given: r.gaps[i].given, sentence: r.gaps[i].sentence, correct: r.gaps[i].correct }))
  const items = await explainGaps({ apiKey, model }, { text: r.text, gaps: all, letterCount })
  const gaps = r.gaps.map((g) => ({ ...g }))
  const now = Date.now()
  const counts = !r.assisted && !r.repeat && r.mode !== 'exam'
  for (const it of items) {
    const idx = it.n - 1
    const g = gaps[idx]
    if (g.reported) continue
    const topic = it.topic === 'vocabulary' ? undefined : it.topic
    Object.assign(g, g.correct ? { topic, strategy: it.strategy } : {
      accepted: it.accepted,
      explanation: it.explanation,
      rule: it.rule,
      trick: it.trick,
      topic,
      strategy: it.strategy,
    })
    const gap = ct.gaps[idx]
    const [a] = ct.sentences[gap.sentence]
    const item = gapItem(g.sentence, { ...gap, start: gap.start - a, end: gap.end - a }, topic, r.textId)
    if (it.accepted) await db.cards.delete(item.key)
    else if (!g.correct) {
      const card = await db.cards.get(item.key)
      if (card && card.item.kind === 'gap') await db.cards.put({ ...card, topic, item: { ...card.item, topic } })
    }
    if (topic && counts)
      await db.attempts.add({ at: now, key: item.key, kind: 'gap', topic, correct: g.correct || it.accepted, assisted: false, source: 'practice' })
  }
  const updated = { ...r, gaps, ...tally(gaps), explained: true }
  await db.results.put(updated)
  return updated
}

function FollowUp({ g, onAnswer }: { g: GapRecord; onAnswer: (q: string, a: string) => Promise<void> }) {
  const settings = useSettings()
  const [q, setQ] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  if (!aiReady(settings)) return null

  const ask = async () => {
    if (!q.trim() || busy) return
    setBusy(true)
    setError('')
    try {
      const a = await askFollowUp(settings, {
        sentence: g.sentence,
        word: g.word,
        given: `${g.prefix}${g.given}`,
        explanation: [g.explanation, g.rule].filter(Boolean).join(' '),
        question: q.trim(),
      })
      await onAnswer(q.trim(), a)
      setQ('')
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="mt-2 space-y-1">
      {g.followUps?.map((f, k) => (
        <div key={k} className="rounded bg-stone-50 p-2">
          <p className="font-medium">{f.q}</p>
          <p>{f.a}</p>
        </div>
      ))}
      <div className="flex gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && void ask()}
          placeholder="Ask a follow-up…"
          className="flex-1 rounded border border-stone-300 px-2 py-1"
        />
        <Btn onClick={() => void ask()} disabled={busy || !q.trim()}>
          {busy ? 'Asking…' : 'Ask'}
        </Btn>
      </div>
      {error && <p className="text-rose-700">{error}</p>}
    </div>
  )
}

export function CTestReview({ result, onAgain, autoExplain = true }: { result: CTestResult; onAgain?: () => void; autoExplain?: boolean }) {
  const settings = useSettings()
  const [r, setR] = useState(result)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tried, setTried] = useState(false)
  const ct = rebuild(r)
  const wrongCount = r.gaps.filter((g) => !g.correct && !g.accepted && !g.reported).length

  const report = async (i: number) => setR(await reportGap(r, i))
  const addFollowUp = async (i: number, q: string, a: string) => {
    const gaps = r.gaps.map((g, j) => (j === i ? { ...g, followUps: [...(g.followUps ?? []), { q, a }] } : g))
    const updated = { ...r, gaps }
    await db.results.put(updated)
    setR(updated)
  }

  const explain = async () => {
    if (!aiReady(settings)) return
    setBusy(true)
    setError('')
    try {
      setR(await applyExplanations(r, settings.letterCount, settings.apiKey, settings.model))
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }

  useEffect(() => {
    if (autoExplain && !tried && !r.explained && aiReady(settings)) {
      setTried(true)
      void explain()
    }
  })

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-semibold">
            {r.correct} / {r.total} <span className="text-base text-stone-500">({Math.round((100 * r.correct) / Math.max(1, r.total))}%)</span>
          </p>
          <p className="text-sm text-stone-500">
            {r.level} · {Math.floor(r.seconds / 60)}m {r.seconds % 60}s{r.repeat ? ' · repeat (not counted in estimates)' : ''}
            {r.assisted ? ' · looked up (not counted in estimates)' : ''}
          </p>
        </div>
        <div className="mt-4 leading-loose">
          {segments(ct).map((s, i) => {
            if ('text' in s) return <span key={i}>{s.text}</span>
            const g = r.gaps[s.gap.id]
            const ok = g.correct || g.accepted
            return (
              <span
                key={i}
                className={`rounded px-0.5 font-mono ${g.reported ? 'bg-stone-100 text-stone-500' : ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}
                title={ok ? '' : `you wrote: ${g.prefix}${g.given}`}
              >
                {g.prefix}
                {ok ? <u>{g.correct ? s.gap.answer : g.given}</u> : <u>{s.gap.answer}</u>}
                {!ok && g.given && <s className="ml-1 text-xs text-rose-500">{g.given}</s>}
              </span>
            )
          })}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {onAgain && <Btn onClick={onAgain}>Next text</Btn>}
          {wrongCount > 0 && aiReady(settings) && !r.explained && (
            <Btn kind="primary" onClick={() => void explain()} disabled={busy}>
              {busy ? 'Explaining…' : 'Explain my mistakes'}
            </Btn>
          )}
          {!aiReady(settings) && wrongCount > 0 && (
            <span className="text-sm text-stone-500">
              Add an OpenRouter key in <Link to="/settings" className="text-indigo-600">Settings</Link> for explanations.
            </span>
          )}
        </div>
        {busy && wrongCount === 0 && <p className="mt-2 text-sm text-stone-500">Tagging grammar topics…</p>}
        {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
      </Card>
      {r.gaps.some((g) => !g.correct) && (
        <Card>
          <h2 className="mb-3 font-semibold">Mistakes</h2>
          <ul className="space-y-4">
            {r.gaps.map((g, i) => {
              if (g.correct) return null
              const topic = g.topic ? TOPIC_BY_ID.get(g.topic) : undefined
              const strategy = STRATEGIES.find((s) => s.id === g.strategy)
              const hint = gradeGap(ct.gaps[i], g.given).spellingHint
              return (
                <li key={i} className="border-l-4 border-rose-300 pl-3 text-sm">
                  <p className="text-stone-600">{g.sentence}</p>
                  <p className="mt-1">
                    <span className="font-mono">
                      {g.prefix}
                      <span className="text-rose-700 line-through">{g.given || '—'}</span>
                    </span>{' '}
                    → <span className="font-mono font-semibold">{g.word}</span>
                    {g.accepted && <span className="ml-2 rounded bg-emerald-100 px-1 text-emerald-800">also correct — counted</span>}
                    {g.reported && <span className="ml-2 rounded bg-stone-100 px-1 text-stone-600">reported — not scored</span>}
                  </p>
                  {hint && <p className="text-rose-700">{hint}</p>}
                  {g.explanation && <p className="mt-1">{g.explanation}</p>}
                  {g.rule && (
                    <p>
                      <span className="font-medium">Rule:</span> {g.rule}
                    </p>
                  )}
                  {g.trick && (
                    <p>
                      <span className="font-medium">Trick:</span> {g.trick}
                    </p>
                  )}
                  <div className="mt-1 flex flex-wrap gap-3">
                    {topic && (
                      <button
                        className="text-indigo-700 hover:underline"
                        onClick={() => openReference({ kind: 'topic', id: topic.id, title: topic.title, detail: '' })}
                      >
                        Lesson: {topic.title}
                      </button>
                    )}
                    {topic && (
                      <Link className="text-indigo-700 hover:underline" to={`/grammar/${topic.id}`}>
                        practise it →
                      </Link>
                    )}
                    {strategy && (
                      <Link className="text-stone-600 hover:underline" to={`/strategies#${strategy.id}`}>
                        Strategy: {strategy.title}
                      </Link>
                    )}
                    {!g.reported && (
                      <button className="text-stone-500 hover:underline" disabled={busy} title="The text is wrong here: stop scoring and reviewing this gap" onClick={() => void report(i)}>
                        Report this gap
                      </button>
                    )}
                  </div>
                  {g.explanation && <FollowUp g={g} onAnswer={(q, a) => addFollowUp(i, q, a)} />}
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
