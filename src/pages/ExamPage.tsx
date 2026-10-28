import { useState } from 'react'
import type { CTestLevel } from '../ctest/texts'
import type { CTestResult } from '../db'
import { aiReady, useSettings } from '../settings'
import { Btn, Card, Page } from '../ui/bits'
import { CTestPlayer, type PlayerText } from '../ui/ctest/Player'
import { CTestReview } from '../ui/ctest/Review'
import { nextText } from '../ui/ctest/source'

type Mix = 'B1' | 'B2' | 'mixed'

function levelsFor(mix: Mix, n: number): CTestLevel[] {
  if (mix !== 'mixed') return Array.from({ length: n }, () => mix)
  return Array.from({ length: n }, (_, i) => (i < Math.ceil(n / 2) ? 'B1' : 'B2'))
}

export function ExamPage() {
  const settings = useSettings()
  const [mix, setMix] = useState<Mix>('mixed')
  const [useAi, setUseAi] = useState(true)
  const [texts, setTexts] = useState<PlayerText[] | null>(null)
  const [results, setResults] = useState<CTestResult[]>([])
  const [loading, setLoading] = useState('')
  const [open, setOpen] = useState<number | null>(null)
  if (!settings) return null

  const start = async () => {
    const levels = levelsFor(mix, settings.examTexts)
    const out: PlayerText[] = []
    for (const [k, level] of levels.entries()) {
      setLoading(`Preparing text ${k + 1} of ${levels.length}…`)
      try {
        out.push(await nextText({ level, useAi: useAi && aiReady(settings), exclude: out.map((t) => t.id) }))
      } catch {
        out.push(await nextText({ level, useAi: false, exclude: out.map((t) => t.id) }))
      }
    }
    setLoading('')
    setResults([])
    setTexts(out)
  }

  if (texts && results.length < texts.length) {
    const k = results.length
    return (
      <Page title={`Exam · text ${k + 1} of ${texts.length}`}>
        <p className="mb-3 text-sm text-stone-500">Reference lookup is off. The next text starts when time runs out or you finish.</p>
        <CTestPlayer
          key={k}
          t={texts[k]}
          mode="exam"
          gaps={settings.gapCount}
          letterCount={settings.letterCount}
          timeLimit={settings.secondsPerText}
          onFinished={(r) => setResults((rs) => [...rs, r])}
        />
      </Page>
    )
  }

  if (texts) {
    const correct = results.reduce((s, r) => s + r.correct, 0)
    const total = results.reduce((s, r) => s + r.total, 0)
    return (
      <Page title="Exam result" actions={<Btn onClick={() => setTexts(null)}>New exam</Btn>}>
        <Card>
          <p className="text-4xl font-semibold">
            {correct}/{total} <span className="text-xl text-stone-500">({Math.round((100 * correct) / Math.max(1, total))}%)</span>
          </p>
          <ul className="mt-3 space-y-1 text-sm">
            {results.map((r, k) => (
              <li key={k} className="flex items-center justify-between">
                <span>
                  {k + 1}. {r.title} ({r.level})
                </span>
                <span className="flex items-center gap-3">
                  {r.correct}/{r.total}
                  <Btn kind="ghost" onClick={() => setOpen(open === k ? null : k)}>
                    {open === k ? 'Hide' : 'Review'}
                  </Btn>
                </span>
              </li>
            ))}
          </ul>
        </Card>
        {open !== null && (
          <div className="mt-4">
            <CTestReview key={open} result={results[open]} autoExplain={false} />
          </div>
        )}
      </Page>
    )
  }

  return (
    <Page title="Exam simulation">
      <Card>
        <p>
          {settings.examTexts} texts, {Math.round(settings.secondsPerText / 60)} minutes each, {settings.gapCount} gaps per text.
          No lookups and no feedback until the end — just like the real thing. Change the format in Settings.
        </p>
        <div className="mt-4 flex flex-wrap items-center gap-3">
          {(['mixed', 'B1', 'B2'] as Mix[]).map((m) => (
            <Btn key={m} kind={m === mix ? 'primary' : 'plain'} onClick={() => setMix(m)}>
              {m === 'mixed' ? 'B1 + B2' : `${m} only`}
            </Btn>
          ))}
          {aiReady(settings) && (
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={useAi} onChange={(e) => setUseAi(e.target.checked)} /> Fresh AI texts
            </label>
          )}
        </div>
        <div className="mt-4">
          <Btn kind="primary" disabled={!!loading} onClick={() => void start()}>
            {loading || 'Start exam'}
          </Btn>
        </div>
      </Card>
    </Page>
  )
}
