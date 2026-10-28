import { useEffect, useState } from 'react'
import { Navigate, useParams } from 'react-router-dom'
import { correctWriting, generateExercises, type WritingFeedback } from '../ai/tasks'
import { TOPIC_BY_ID } from '../content/index'
import { db, grade, setTopic } from '../db'
import { exerciseItem, fixItem, type Item } from '../practice/items'
import { interleaved, shuffle, topicItems } from '../practice/pools'
import { aiReady, useSettings } from '../settings'
import { Btn, Card, Page, STATUS_STYLE, useActivity } from '../ui/bits'
import { LessonView } from '../ui/ContentViews'
import { Drill, type DrillOutcome } from '../ui/Drill'
import { introducedTopics, useMastery, useTopicStates } from '../ui/hooks'

type Tab = 'lesson' | 'practice' | 'testout' | 'ai' | 'write'

export function WriteTab({ topicId, prompts }: { topicId: string; prompts: string[] }) {
  const settings = useSettings()
  const [task, setTask] = useState(prompts[0])
  const [text, setText] = useState('')
  const [fb, setFb] = useState<WritingFeedback | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  useActivity(`write:${topicId}`)
  if (!aiReady(settings)) return <p className="text-sm text-stone-500">Sentence writing is corrected by AI — add an OpenRouter key in Settings.</p>
  const check = async () => {
    setBusy(true)
    setError('')
    try {
      const out = await correctWriting(settings, { topic: topicId, task, answer: text })
      setFb(out)
      await db.attempts.add({
        at: Date.now(),
        key: `write:${topicId}`,
        kind: 'exercise',
        topic: topicId,
        correct: out.correct && out.usedTopic,
        assisted: false,
        source: 'practice',
      })
      for (const err of out.errors) {
        const item = fixItem(out.corrected, err.right, topicId)
        if (item) await grade(item, 'wrong')
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <Card>
      <div className="space-y-3">
        <select value={task} onChange={(e) => setTask(e.target.value)} className="w-full rounded border border-stone-300 px-2 py-1 text-sm">
          {prompts.map((p) => (
            <option key={p}>{p}</option>
          ))}
        </select>
        <p className="text-sm">{task}</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={4}
          className="w-full rounded-lg border border-stone-300 p-3"
          placeholder="Schreib hier…"
        />
        <Btn kind="primary" disabled={busy || text.trim().length < 5} onClick={() => void check()}>
          {busy ? 'Checking…' : 'Correct my German'}
        </Btn>
        {error && <p className="text-sm text-rose-700">{error}</p>}
        {fb && (
          <div className={`rounded-lg border p-3 text-sm ${fb.correct ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'}`}>
            <p className="font-semibold">{fb.correct ? '✓ No errors' : 'Corrected:'}</p>
            {!fb.correct && <p className="mt-1 font-medium">{fb.corrected}</p>}
            <ul className="mt-2 space-y-1">
              {fb.errors.map((e, i) => (
                <li key={i}>
                  <s className="text-rose-700">{e.wrong}</s> → <b>{e.right}</b> — {e.rule}
                </li>
              ))}
            </ul>
            {!fb.usedTopic && <p className="mt-1 text-amber-800">You didn't really use the target grammar — try again with it.</p>}
            {fb.comment && <p className="mt-1 text-stone-600">{fb.comment}</p>}
          </div>
        )}
      </div>
    </Card>
  )
}

function AiTab({ topicId, level }: { topicId: string; level: string }) {
  const settings = useSettings()
  const [items, setItems] = useState<Item[] | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [round, setRound] = useState(0)
  useActivity(items ? `ai:${topicId}` : null)
  if (!aiReady(settings)) return <p className="text-sm text-stone-500">Add an OpenRouter key in Settings for unlimited exercises.</p>
  const gen = async () => {
    setBusy(true)
    setError('')
    try {
      const ex = await generateExercises(settings, {
        topic: topicId,
        kinds: ['gap', 'gap', 'choice', 'transform'],
        count: 8,
        level,
        avoid: TOPIC_BY_ID.get(topicId)?.exercises.map((e) => (e.kind === 'gap' ? e.text : e.kind === 'choice' ? e.prompt : e.source)),
      })
      setItems(ex.map(exerciseItem))
      setRound((r) => r + 1)
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-3">
      <Btn kind="primary" disabled={busy} onClick={() => void gen()}>
        {busy ? 'Generating…' : items ? 'Generate 8 more' : 'Generate 8 exercises'}
      </Btn>
      {error && <p className="text-sm text-rose-700">{error}</p>}
      {items && <Drill key={round} items={items} source="practice" />}
    </div>
  )
}

export function TopicPage() {
  const { id = '' } = useParams()
  const topic = TOPIC_BY_ID.get(id)
  const mastery = useMastery()
  const states = useTopicStates()
  const [tab, setTab] = useState<Tab>('lesson')
  const [items, setItems] = useState<Item[]>([])
  const [round, setRound] = useState(0)
  const [testResult, setTestResult] = useState<string>('')

  useEffect(() => {
    setTab('lesson')
    setTestResult('')
  }, [id])

  useActivity(tab === 'practice' || tab === 'testout' ? `${tab}:${id}` : null)
  if (!topic) return <Navigate to="/grammar" replace />
  const m = mastery?.[id]
  const state = states?.[id]

  const practise = async () => {
    await setTopic(id, { lessonAt: state?.lessonAt ?? Date.now() })
    setItems(interleaved(id, await introducedTopics(), 12))
    setRound((r) => r + 1)
    setTab('practice')
  }
  const testOut = () => {
    setItems(shuffle(topicItems(id)).slice(0, 6))
    setRound((r) => r + 1)
    setTestResult('')
    setTab('testout')
  }
  const onTestDone = async (o: DrillOutcome[]) => {
    const right = o.filter((x) => x.correct && !x.assisted).length
    if (right >= 5) {
      await setTopic(id, { testedOutAt: Date.now() })
      setTestResult(`${right}/6 — tested out. This topic now counts as mastered; reviews will keep it fresh.`)
    } else setTestResult(`${right}/6 — not quite. Read the lesson and practise; you need 5/6 without lookups.`)
  }

  const tabs: [Tab, string][] = [
    ['lesson', 'Lesson'],
    ['practice', 'Practice'],
    ['testout', 'Test out'],
    ['ai', 'More (AI)'],
    ['write', 'Write (AI)'],
  ]

  return (
    <Page
      title={topic.title}
      actions={
        <div className="flex items-center gap-2">
          {m && (
            <span className={`rounded border px-2 py-0.5 text-xs ${STATUS_STYLE[m.status]}`}>
              {topic.level} · {m.n > 0 ? `${Math.round(m.score * 100)}%` : m.status}
            </span>
          )}
          <Btn kind="ghost" onClick={() => void setTopic(id, { known: !state?.known })}>
            {state?.known ? 'Unmark known' : 'I know this'}
          </Btn>
        </div>
      }
    >
      <div className="mb-4 flex gap-1 border-b border-stone-200">
        {tabs.map(([t, label]) => (
          <button
            key={t}
            onClick={() => (t === 'practice' ? void practise() : t === 'testout' ? testOut() : setTab(t))}
            className={`px-3 py-2 text-sm ${tab === t ? 'border-b-2 border-indigo-600 font-semibold' : 'text-stone-500'}`}
          >
            {label}
          </button>
        ))}
      </div>
      {tab === 'lesson' && (
        <Card>
          <LessonView topic={topic} />
          <div className="mt-6 flex gap-2">
            <Btn kind="primary" onClick={() => void practise()}>
              Drill it now
            </Btn>
            <Btn onClick={testOut}>I think I know it — test me</Btn>
          </div>
        </Card>
      )}
      {tab === 'practice' && (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">Mostly this topic, mixed with topics you've already met.</p>
          <Drill key={round} items={items} source="practice" doneLabel="Mistakes go to your review queue." />
          <Btn onClick={() => void practise()}>Another round</Btn>
        </div>
      )}
      {tab === 'testout' && (
        <div className="space-y-3">
          <p className="text-sm text-stone-500">6 questions, no feedback until the end. 5/6 without lookups marks the topic as mastered.</p>
          <Drill key={round} items={items} source="testout" mode="test" onDone={(o) => void onTestDone(o)} />
          {testResult && <p className="font-medium">{testResult}</p>}
        </div>
      )}
      {tab === 'ai' && <AiTab topicId={id} level={topic.level} />}
      {tab === 'write' && <WriteTab topicId={id} prompts={topic.writing} />}
    </Page>
  )
}
