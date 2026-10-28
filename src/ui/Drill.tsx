import { useCallback, useEffect, useRef, useState } from 'react'
import { parseGapText } from '../content/exercise'
import { TABLE_BY_ID, TOPIC_BY_ID } from '../content/index'
import { markKnown, record, type Source } from '../db'
import { checkItem, verbPrompt, type Answer, type Item, type Result } from '../practice/items'
import { Btn, fmtTime, Kbd, Rich } from './bits'
import { lookupCount, openReference } from './lookup'

export type DrillMode = 'learn' | 'rapid' | 'test'
export type DrillOutcome = { item: Item; correct: boolean; assisted: boolean }

type Props = {
  items: Item[]
  source: Source
  mode?: DrillMode
  timeLimit?: number
  onDone?: (outcomes: DrillOutcome[]) => void
  doneLabel?: string
}

function GapInputs({
  text,
  values,
  onChange,
  disabled,
  firstRef,
}: {
  text: string
  values: string[]
  onChange: (v: string[]) => void
  disabled: boolean
  firstRef: React.RefObject<HTMLInputElement | null>
}) {
  let n = -1
  return (
    <p className="text-lg leading-loose">
      {parseGapText(text).map((p, i) => {
        if ('text' in p) return <span key={i}>{p.text}</span>
        n++
        const k = n
        const w = Math.max(3, ...p.answers.map((a) => [...a].length)) + 1
        return (
          <input
            key={i}
            ref={k === 0 ? firstRef : undefined}
            disabled={disabled}
            value={values[k] ?? ''}
            onChange={(e) => {
              const next = [...values]
              next[k] = e.target.value
              onChange(next)
            }}
            style={{ width: `${w}ch` }}
            className="mx-0.5 rounded border-b-2 border-indigo-400 bg-indigo-50 px-1 font-mono outline-none focus:border-indigo-700"
            autoComplete="off"
            spellCheck={false}
          />
        )
      })}
    </p>
  )
}

function Prompt({
  item,
  answer,
  setAnswer,
  locked,
  firstRef,
}: {
  item: Item
  answer: Answer
  setAnswer: (a: Answer) => void
  locked: boolean
  firstRef: React.RefObject<HTMLInputElement | null>
}) {
  const textInput = (placeholder = 'type the answer') => (
    <input
      ref={firstRef}
      disabled={locked}
      value={typeof answer === 'string' ? answer : ''}
      onChange={(e) => setAnswer(e.target.value)}
      placeholder={placeholder}
      className="mt-3 w-full rounded-lg border border-stone-300 px-3 py-2 font-mono text-lg"
      autoComplete="off"
      spellCheck={false}
    />
  )
  if (item.kind === 'exercise') {
    const e = item.exercise
    if (e.kind === 'gap')
      return (
        <div>
          <GapInputs
            text={e.text}
            values={Array.isArray(answer) ? answer : []}
            onChange={setAnswer}
            disabled={locked}
            firstRef={firstRef}
          />
          {e.en && <p className="text-sm text-stone-500">{e.en}</p>}
        </div>
      )
    if (e.kind === 'choice')
      return (
        <div>
          <p className="text-lg">{e.prompt}</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {e.options.map((o, i) => (
              <button
                key={o}
                disabled={locked}
                onClick={() => setAnswer(i)}
                className={`rounded-lg border px-3 py-2 text-left ${
                  answer === i ? 'border-indigo-500 bg-indigo-50' : 'border-stone-300 bg-white hover:bg-stone-50'
                }`}
              >
                <Kbd>{i + 1}</Kbd> {o}
              </button>
            ))}
          </div>
        </div>
      )
    return (
      <div>
        <p className="text-sm text-stone-500">{e.instruction}</p>
        <p className="mt-1 text-lg">{e.source}</p>
        {textInput('write the whole sentence')}
      </div>
    )
  }
  if (item.kind === 'cell') {
    const t = TABLE_BY_ID.get(item.tableId)
    return (
      <div>
        <p className="text-sm text-stone-500">{t?.title}</p>
        <p className="mt-1 text-lg">
          {t?.rows[item.r]} · {t?.cols[item.c]}
        </p>
        {textInput()}
      </div>
    )
  }
  if (item.kind === 'verb')
    return (
      <div>
        <p className="text-lg">{verbPrompt(item.inf, item.tense, item.person)}</p>
        {textInput('e.g. ist gegangen')}
      </div>
    )
  return (
    <p className="text-lg leading-loose">
      {item.before}
      {item.gap.prefix}
      <input
        ref={firstRef}
        disabled={locked}
        value={typeof answer === 'string' ? answer : ''}
        onChange={(e) => setAnswer(e.target.value)}
        style={{ width: `${[...item.gap.answer].length + 2}ch` }}
        className="rounded border-b-2 border-indigo-400 bg-indigo-50 px-1 font-mono outline-none"
        autoComplete="off"
        spellCheck={false}
      />
      {item.after}
    </p>
  )
}

export function FeedbackBox({ result, topic }: { result: Result; topic?: string }) {
  const t = topic ? TOPIC_BY_ID.get(topic) : undefined
  return (
    <div
      className={`mt-4 rounded-lg border p-3 text-sm ${
        result.correct ? 'border-emerald-300 bg-emerald-50' : 'border-rose-300 bg-rose-50'
      }`}
    >
      <p className="font-semibold">{result.correct ? '✓ Correct' : `✗ ${result.expected}`}</p>
      {result.hint && <p className="mt-1">{result.hint}</p>}
      {result.fb && (
        <div className="mt-1 space-y-0.5">
          <p>
            <span className="font-medium">Rule:</span> <Rich text={result.fb.rule} />
          </p>
          <p>
            <span className="font-medium">Cue:</span> {result.fb.cue}
          </p>
          {result.fb.trick && (
            <p>
              <span className="font-medium">Trick:</span> {result.fb.trick}
            </p>
          )}
        </div>
      )}
      {t && (
        <button
          className="mt-2 text-indigo-700 hover:underline"
          onClick={() => openReference({ kind: 'topic', id: t.id, title: t.title, detail: '' })}
        >
          Open lesson: {t.title}
        </button>
      )}
    </div>
  )
}

function initialAnswer(item: Item): Answer {
  return item.kind === 'exercise' && item.exercise.kind === 'gap' ? [] : item.kind === 'exercise' && item.exercise.kind === 'choice' ? -1 : ''
}

export function Drill({ items, source, mode = 'learn', timeLimit, onDone, doneLabel = 'Done' }: Props) {
  const [i, setI] = useState(0)
  const [answer, setAnswer] = useState<Answer>(() => (items[0] ? initialAnswer(items[0]) : ''))
  const [result, setResult] = useState<Result | null>(null)
  const [outcomes, setOutcomes] = useState<DrillOutcome[]>([])
  const [finished, setFinished] = useState(items.length === 0)
  const [left, setLeft] = useState(timeLimit ?? 0)
  const startLookups = useRef(lookupCount())
  const startedAt = useRef(Date.now())
  const firstRef = useRef<HTMLInputElement>(null)
  const box = useRef<HTMLDivElement>(null)
  const item = items[i]

  const finish = useCallback(
    (all: DrillOutcome[]) => {
      setFinished(true)
      onDone?.(all)
    },
    [onDone],
  )

  const advance = useCallback(
    (all: DrillOutcome[]) => {
      if (i + 1 >= items.length) return finish(all)
      setI(i + 1)
      setAnswer(initialAnswer(items[i + 1]))
      setResult(null)
      startLookups.current = lookupCount()
    },
    [i, items, finish],
  )

  const submit = useCallback(
    (a: Answer = answer) => {
      if (!item || result) return
      if (item.kind === 'exercise' && item.exercise.kind === 'choice' && a === -1) return
      const r = checkItem(item, a)
      const assisted = lookupCount() !== startLookups.current
      void record(item, r.correct, { assisted, source })
      const all = [...outcomes, { item, correct: r.correct, assisted }]
      setOutcomes(all)
      if (mode === 'test') return advance(all)
      setResult(r)
      if (mode === 'rapid' && r.correct) setTimeout(() => advance(all), 450)
    },
    [answer, item, result, outcomes, source, mode, advance],
  )

  const skip = useCallback(() => advance(outcomes), [advance, outcomes])
  const known = useCallback(() => {
    if (!item) return
    void markKnown(item)
    advance(outcomes)
  }, [item, advance, outcomes])

  useEffect(() => {
    if (!finished) setTimeout(() => (firstRef.current ?? box.current)?.focus(), 0)
  }, [i, finished])

  useEffect(() => {
    if (!timeLimit || finished) return
    const id = setInterval(() => setLeft(timeLimit - Math.floor((Date.now() - startedAt.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [timeLimit, finished])
  useEffect(() => {
    if (timeLimit && left <= 0 && !finished) finish(outcomes)
  }, [left, timeLimit, finished, finish, outcomes])

  const onKey = (e: React.KeyboardEvent) => {
    if (finished || !item) return
    if (e.key === 'Enter') {
      e.preventDefault()
      if (result) advance(outcomes)
      else submit()
    } else if (e.key === 'Escape') {
      e.preventDefault()
      skip()
    } else if (e.altKey && e.key.toLowerCase() === 'k') {
      e.preventDefault()
      known()
    } else if (!result && item.kind === 'exercise' && item.exercise.kind === 'choice' && /^[1-9]$/.test(e.key)) {
      const n = Number(e.key) - 1
      if (n < item.exercise.options.length) {
        setAnswer(n)
        submit(n)
      }
    }
  }

  if (finished) {
    const right = outcomes.filter((o) => o.correct).length
    const wrong = outcomes.filter((o) => !o.correct)
    return (
      <div className="rounded-xl border border-stone-200 bg-white p-5">
        <p className="text-lg font-semibold">
          {right} / {outcomes.length} correct
          {outcomes.some((o) => o.assisted) && (
            <span className="ml-2 text-sm font-normal text-stone-500">(some answers looked up — not counted)</span>
          )}
        </p>
        {wrong.length > 0 && mode !== 'test' && (
          <p className="mt-1 text-sm text-stone-600">{wrong.length} mistakes were added to your review queue.</p>
        )}
        {items.length === 0 && <p className="text-stone-500">Nothing to practise here right now.</p>}
        <p className="mt-2 text-sm text-stone-500">{doneLabel}</p>
      </div>
    )
  }

  return (
    <div
      ref={box}
      tabIndex={-1}
      onKeyDown={onKey}
      className="rounded-xl border border-stone-200 bg-white p-5 shadow-sm outline-none"
    >
      <div className="mb-3 flex items-center justify-between text-xs text-stone-500">
        <span>
          {i + 1} / {items.length}
          {item.topic && TOPIC_BY_ID.get(item.topic) && ` · ${TOPIC_BY_ID.get(item.topic)!.title}`}
        </span>
        {timeLimit ? <span className="font-mono text-base text-stone-800">{fmtTime(left)}</span> : null}
      </div>
      <Prompt item={item} answer={answer} setAnswer={setAnswer} locked={!!result} firstRef={firstRef} />
      {result && <FeedbackBox result={result} topic={item.topic} />}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {result ? (
          <Btn kind="primary" onClick={() => advance(outcomes)}>
            Next <Kbd>Enter</Kbd>
          </Btn>
        ) : (
          <Btn kind="primary" onClick={() => submit()}>
            Check <Kbd>Enter</Kbd>
          </Btn>
        )}
        {!result && (
          <Btn kind="ghost" onClick={skip}>
            Skip <Kbd>Esc</Kbd>
          </Btn>
        )}
        {mode !== 'test' && !result && (
          <Btn kind="ghost" onClick={known} title="Push this far into the future">
            I know this <Kbd>Alt+K</Kbd>
          </Btn>
        )}
      </div>
    </div>
  )
}
