import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { explainMistakes } from '../../ai/tasks'
import { TOPIC_BY_ID } from '../../content/index'
import { STRATEGIES } from '../../content/strategies'
import { gradeGap, makeCTest, segments } from '../../ctest/gapper'
import { db, type CTestResult } from '../../db'
import { gapItem } from '../../practice/items'
import { aiReady, useSettings } from '../../settings'
import { Btn, Card } from '../bits'
import { openReference } from '../lookup'

export function rebuild(r: CTestResult) {
  return makeCTest(r.text, { gaps: r.total, properNames: r.properNames })
}

async function applyExplanations(r: CTestResult, letterCount: boolean, apiKey: string, model: string) {
  const ct = rebuild(r)
  const wrong = ct.gaps
    .map((g, i) => ({ g, i, rec: r.gaps[i] }))
    .filter((x) => !x.rec.correct)
    .map((x) => ({ n: x.i + 1, gap: x.g, given: x.rec.given, sentence: x.rec.sentence }))
  if (wrong.length === 0) return r
  const items = await explainMistakes({ apiKey, model }, { text: r.text, wrong, letterCount })
  const gaps = r.gaps.map((g) => ({ ...g }))
  const now = Date.now()
  for (const it of items) {
    const idx = it.n - 1
    const g = gaps[idx]
    Object.assign(g, {
      accepted: it.accepted,
      explanation: it.explanation,
      rule: it.rule,
      trick: it.trick,
      topic: it.topic === 'vocabulary' ? undefined : it.topic,
      strategy: it.strategy,
    })
    const gap = ct.gaps[idx]
    const [a] = ct.sentences[gap.sentence]
    const item = gapItem(g.sentence, { ...gap, start: gap.start - a, end: gap.end - a }, g.topic, r.textId)
    if (it.accepted) {
      await db.cards.delete(item.key)
      continue
    }
    const card = await db.cards.get(item.key)
    if (card && card.item.kind === 'gap') await db.cards.put({ ...card, topic: g.topic, item: { ...card.item, topic: g.topic } })
    if (g.topic && !r.assisted && r.mode !== 'exam')
      await db.attempts.add({ at: now, key: item.key, kind: 'gap', topic: g.topic, correct: false, assisted: false, source: 'practice' })
  }
  const correct = gaps.filter((g) => g.correct || g.accepted).length
  const updated = { ...r, gaps, correct, explained: true }
  await db.results.put(updated)
  return updated
}

export function CTestReview({ result, onAgain, autoExplain = true }: { result: CTestResult; onAgain?: () => void; autoExplain?: boolean }) {
  const settings = useSettings()
  const [r, setR] = useState(result)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [tried, setTried] = useState(false)
  const ct = rebuild(r)
  const wrongCount = r.gaps.filter((g) => !g.correct && !g.accepted).length

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
    if (autoExplain && !tried && !r.explained && aiReady(settings) && r.gaps.some((g) => !g.correct)) {
      setTried(true)
      void explain()
    }
  })

  return (
    <div className="space-y-4">
      <Card>
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <p className="text-2xl font-semibold">
            {r.correct} / {r.total} <span className="text-base text-stone-500">({Math.round((100 * r.correct) / r.total)}%)</span>
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
                className={`rounded px-0.5 font-mono ${ok ? 'bg-emerald-100 text-emerald-900' : 'bg-rose-100 text-rose-900'}`}
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
                  </div>
                </li>
              )
            })}
          </ul>
        </Card>
      )}
    </div>
  )
}
