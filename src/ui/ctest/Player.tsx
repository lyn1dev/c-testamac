import { useEffect, useMemo, useRef, useState } from 'react'
import { db, grade, type CTestResult } from '../../db'
import { gradeGap, HIDDEN_GAP, makeCTest, segments } from '../../ctest/gapper'
import type { CTestLevel } from '../../ctest/texts'
import { gapItem } from '../../practice/items'
import { Btn, fmtTime, Kbd, useActivity } from '../bits'
import { lookupCount } from '../lookup'

export type PlayerText = { id: string; title: string; text: string; properNames: string[]; level: CTestLevel }

type Props = {
  t: PlayerText
  mode: CTestResult['mode']
  gaps: number
  letterCount: boolean
  timeLimit?: number
  onFinished: (r: CTestResult) => void
}

export function sentenceOf(text: string, range: [number, number]) {
  return text.slice(range[0], range[1])
}

export function CTestPlayer({ t, mode, gaps, letterCount, timeLimit, onFinished }: Props) {
  const ct = useMemo(() => makeCTest(t.text, { gaps, properNames: t.properNames }), [t, gaps])
  const [values, setValues] = useState<string[]>(() => ct.gaps.map(() => ''))
  const [left, setLeft] = useState(timeLimit ?? 0)
  const started = useRef(Date.now())
  const lookups = useRef(lookupCount())
  const done = useRef(false)
  const leftTab = useRef(false)
  const inputs = useRef<(HTMLInputElement | null)[]>([])
  useActivity(`ctest:${t.id}`, mode === 'exam')

  const submit = async () => {
    if (done.current) return
    done.current = true
    const assisted = lookupCount() !== lookups.current || leftTab.current
    const repeat = (await db.results.filter((r) => r.textId === t.id).count()) > 0
    const now = Date.now()
    const records = ct.gaps.map((g, i) => {
      const sentence = sentenceOf(ct.text, ct.sentences[g.sentence])
      return { word: g.word, prefix: g.prefix, given: values[i].trim(), correct: gradeGap(g, values[i]).correct, sentence }
    })
    const result: CTestResult = {
      at: now,
      textId: t.id,
      title: t.title,
      level: t.level,
      mode,
      correct: records.filter((r) => r.correct).length,
      total: ct.gaps.length,
      seconds: Math.round((now - started.current) / 1000),
      assisted,
      repeat,
      leftTab: leftTab.current,
      text: t.text,
      properNames: t.properNames,
      gaps: records,
    }
    result.id = await db.results.add(result)
    for (const [i, g] of ct.gaps.entries()) {
      if (records[i].correct) continue
      const [a] = ct.sentences[g.sentence]
      await grade(gapItem(records[i].sentence, { ...g, start: g.start - a, end: g.end - a }, undefined, t.id), 'wrong')
    }
    onFinished(result)
  }

  useEffect(() => {
    inputs.current[0]?.focus()
  }, [])
  useEffect(() => {
    if (!timeLimit) return
    const onHide = () => {
      if (document.hidden) leftTab.current = true
    }
    document.addEventListener('visibilitychange', onHide)
    return () => document.removeEventListener('visibilitychange', onHide)
  }, [timeLimit])
  useEffect(() => {
    if (!timeLimit) return
    const id = setInterval(() => setLeft(timeLimit - Math.floor((Date.now() - started.current) / 1000)), 1000)
    return () => clearInterval(id)
  }, [timeLimit])
  useEffect(() => {
    if (timeLimit && left <= 0) void submit()
  })

  const filled = values.filter((v) => v.trim()).length

  return (
    <div
      onKeyDown={(e) => {
        if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
          e.preventDefault()
          void submit()
        }
      }}
    >
      <div className="mb-3 flex items-center justify-between text-sm text-stone-600">
        <span>
          {t.title} · {t.level} · {filled}/{ct.gaps.length} filled
        </span>
        {timeLimit ? (
          <span className={`font-mono text-lg ${left < 30 ? 'text-rose-600' : 'text-stone-800'}`}>{fmtTime(left)}</span>
        ) : null}
      </div>
      <div className="rounded-xl border border-stone-200 bg-white p-6 text-lg leading-[2.4] shadow-sm">
        {segments(ct).map((s, i) => {
          if ('text' in s) return <span key={i}>{s.text}</span>
          const k = s.gap.id
          const len = [...s.gap.answer].length
          return (
            <span key={i} className="whitespace-nowrap">
              {s.gap.prefix}
              <input
                ref={(el) => {
                  inputs.current[k] = el
                }}
                value={values[k]}
                onChange={(e) => setValues((v) => v.map((x, j) => (j === k ? e.target.value : x)))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.ctrlKey && !e.metaKey) {
                    e.preventDefault()
                    inputs.current[k + 1]?.focus()
                  }
                }}
                placeholder={letterCount ? '_'.repeat(len) : HIDDEN_GAP}
                style={{ width: `${(letterCount ? len : 6) + 1.5}ch` }}
                className="mx-px rounded-sm border-b-2 border-indigo-400 bg-indigo-50 px-0.5 font-mono outline-none placeholder:text-stone-400 focus:border-indigo-700"
                autoComplete="off"
                spellCheck={false}
                autoCapitalize="off"
              />
            </span>
          )
        })}
      </div>
      <div className="mt-4 flex items-center gap-3">
        <Btn kind="primary" onClick={() => void submit()}>
          Finish <Kbd>Ctrl+Enter</Kbd>
        </Btn>
        <span className="text-xs text-stone-500">
          Tab / Enter → next gap · only the exact spelling counts (ä ö ü ß)
        </span>
      </div>
    </div>
  )
}
