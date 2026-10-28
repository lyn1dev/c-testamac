import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { TOPIC_BY_ID } from '../content/index'
import { db, setTopic, type CTestResult } from '../db'
import type { Item } from '../practice/items'
import { weakestTopics } from '../practice/mastery'
import { dueItems, interleaved, levelTopics, mixedItems, shuffle, topicItems } from '../practice/pools'
import { planSession, type Step } from '../practice/session'
import { loadSettings, useSettings } from '../settings'
import { Btn, Card, Page, useActivity } from '../ui/bits'
import { LessonView } from '../ui/ContentViews'
import { CTestPlayer, type PlayerText } from '../ui/ctest/Player'
import { CTestReview } from '../ui/ctest/Review'
import { currentLevel, nextText } from '../ui/ctest/source'
import { Drill } from '../ui/Drill'
import { introducedTopics, loadMastery, nextNewTopic } from '../ui/hooks'

const LABEL: Record<Step['kind'], string> = {
  review: 'Due reviews',
  lesson: 'New grammar topic',
  ctest: 'C-test',
  weak: 'Weakest area',
  mixed: 'Mixed practice',
}

function describe(s: Step) {
  if (s.kind === 'lesson' || s.kind === 'weak') return `${LABEL[s.kind]}: ${TOPIC_BY_ID.get(s.topic)?.title}`
  if (s.kind === 'ctest') return `${LABEL.ctest} (${s.level})`
  return `${LABEL[s.kind]} (${s.count})`
}

async function makePlan(minutes: number): Promise<Step[]> {
  const [mastery, nextTopic, level, dueCount] = await Promise.all([
    loadMastery(),
    nextNewTopic(),
    currentLevel(),
    db.cards.where('due').belowOrEqual(Date.now()).count(),
  ])
  return planSession({ minutes, dueCount, nextTopic, weakestTopic: weakestTopics(mastery, 1)[0], level })
}

function StepRunner({ step, onNext }: { step: Step; onNext: () => void }) {
  const settings = useSettings()
  const [items, setItems] = useState<Item[] | null>(null)
  const [drillDone, setDrillDone] = useState(false)
  const [lessonRead, setLessonRead] = useState(false)
  const [text, setText] = useState<PlayerText | null>(null)
  const [result, setResult] = useState<CTestResult | null>(null)
  const [error, setError] = useState('')
  useActivity(step.kind === 'lesson' && !lessonRead ? null : `session:${step.kind}`)

  useEffect(() => {
    const load = async () => {
      if (step.kind === 'review') setItems(await dueItems(step.count))
      if (step.kind === 'weak') setItems(shuffle(topicItems(step.topic)).slice(0, step.count))
      if (step.kind === 'mixed') {
        const intro = await introducedTopics()
        setItems(mixedItems(intro.length >= 3 ? intro : levelTopics('A2'), step.count))
      }
      if (step.kind === 'lesson') setItems(interleaved(step.topic, await introducedTopics(), 8))
      if (step.kind === 'ctest') {
        try {
          setText(await nextText({ level: step.level }))
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e))
          setText(await nextText({ level: step.level, useAi: false }))
        }
      }
    }
    void load()
  }, [step])

  if (!settings) return null
  const next = (
    <div className="mt-3">
      <Btn kind="primary" onClick={onNext}>
        Continue
      </Btn>
    </div>
  )

  if (step.kind === 'ctest') {
    if (result)
      return (
        <>
          <CTestReview result={result} />
          {next}
        </>
      )
    if (!text) return <p className="text-stone-500">Preparing a text…</p>
    return (
      <>
        {error && <p className="mb-2 text-sm text-amber-700">AI text failed ({error}); using a built-in text.</p>}
        <CTestPlayer
          t={text}
          mode="session"
          gaps={settings.gapCount}
          letterCount={settings.letterCount}
          timeLimit={settings.secondsPerText}
          onFinished={setResult}
        />
      </>
    )
  }

  if (step.kind === 'lesson' && !lessonRead) {
    const topic = TOPIC_BY_ID.get(step.topic)!
    return (
      <Card>
        <h2 className="mb-2 text-xl font-semibold">{topic.title}</h2>
        <LessonView topic={topic} />
        <div className="mt-4 flex gap-2">
          <Btn
            kind="primary"
            onClick={() => {
              void setTopic(step.topic, { lessonAt: Date.now() })
              setLessonRead(true)
            }}
          >
            Drill it
          </Btn>
          <Btn
            onClick={() => {
              void setTopic(step.topic, { known: true })
              onNext()
            }}
          >
            I know this — skip
          </Btn>
        </div>
      </Card>
    )
  }

  if (!items) return null
  return (
    <>
      <Drill items={items} source="session" mode={step.kind === 'review' ? 'rapid' : 'learn'} onDone={() => setDrillDone(true)} />
      {drillDone ? next : (
        <div className="mt-3">
          <Btn kind="ghost" onClick={onNext}>
            Skip this step
          </Btn>
        </div>
      )}
    </>
  )
}

export function SessionPage() {
  const [params] = useSearchParams()
  const [plan, setPlan] = useState<Step[] | null>(null)
  const [i, setI] = useState(-1)

  useEffect(() => {
    void loadSettings().then(async (s) => setPlan(await makePlan(Number(params.get('min')) || s.sessionMinutes)))
  }, [params])

  if (!plan) return null
  const total = plan.reduce((s, x) => s + x.minutes, 0)

  return (
    <Page title="Today's session">
      <ol className="mb-6 flex flex-wrap gap-2 text-sm">
        {plan.map((s, k) => (
          <li
            key={k}
            className={`rounded-full border px-3 py-1 ${k === i ? 'border-indigo-500 bg-indigo-50 font-medium' : k < i ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : 'border-stone-200'}`}
          >
            {describe(s)} · {s.minutes}′
          </li>
        ))}
      </ol>
      {i === -1 && (
        <Card>
          <p>
            About {total} minutes in {plan.length} steps. Skip anything you like — skipped steps don't count against you.
          </p>
          <div className="mt-4">
            <Btn kind="primary" onClick={() => setI(0)}>
              Begin
            </Btn>
          </div>
        </Card>
      )}
      {i >= 0 && i < plan.length && <StepRunner key={i} step={plan[i]} onNext={() => setI(i + 1)} />}
      {i >= plan.length && (
        <Card>
          <p className="text-lg font-semibold">Done for today.</p>
          <p className="mt-1 text-sm text-stone-600">Your mistakes are scheduled for review. See you tomorrow.</p>
          <Link to="/" className="mt-3 inline-block text-indigo-700 hover:underline">
            Back to the dashboard
          </Link>
        </Card>
      )}
    </Page>
  )
}
