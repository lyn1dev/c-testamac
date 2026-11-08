import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TOPIC_BY_ID, TOPICS } from '../content/index'
import type { Level } from '../content/types'
import { BUILTIN_TEXTS } from '../ctest/texts'
import { setTopic, type CTestResult } from '../db'
import { exerciseItem, type Item } from '../practice/items'
import { shuffle } from '../practice/pools'
import { saveSetting, useSettings } from '../settings'
import { Btn, Card, Page } from '../ui/bits'
import { CTestPlayer } from '../ui/ctest/Player'
import { Drill, type DrillOutcome } from '../ui/Drill'

type Step = 'intro' | 'A2' | 'B1' | 'B2' | 'ctB1' | 'ctB2' | 'done'

function placementItems(level: Level): Item[] {
  return TOPICS.filter((t) => t.level === level).map((t) => {
    const quick = t.exercises.filter((e) => e.kind !== 'transform')
    return exerciseItem(shuffle(quick.length ? quick : t.exercises)[0])
  })
}

const PASS: Record<Level, number> = { A2: 0.7, B1: 0.6, B2: 0 }

export function PlacementPage() {
  const settings = useSettings()
  const nav = useNavigate()
  const [step, setStep] = useState<Step>('intro')
  const [grammar, setGrammar] = useState<Partial<Record<Level, DrillOutcome[]>>>({})
  const [ctests, setCtests] = useState<CTestResult[]>([])
  const items = useMemo(() => ({ A2: placementItems('A2'), B1: placementItems('B1'), B2: placementItems('B2') }), [])
  if (!settings) return null

  const finish = async (g = grammar) => {
    for (const level of ['A2', 'B1', 'B2'] as Level[]) {
      const o = g[level]
      if (!o?.length) continue
      const pct = o.filter((x) => x.correct && !x.assisted).length / items[level].length
      if (pct >= 0.9) for (const t of TOPICS.filter((x) => x.level === level)) await setTopic(t.id, { testedOutAt: Date.now() })
    }
    await saveSetting('placementDone', true)
    setStep('done')
  }

  const grammarDone = (level: Level, o: DrillOutcome[]) => {
    const g = { ...grammar, [level]: o }
    setGrammar(g)
    const pct = o.filter((x) => x.correct).length / items[level].length
    if (level === 'A2') setStep(pct >= PASS.A2 ? 'B1' : 'ctB1')
    else if (level === 'B1') setStep(pct >= PASS.B1 ? 'B2' : 'ctB1')
    else setStep('ctB1')
  }

  const skip = async () => {
    await saveSetting('placementDone', true)
    nav('/')
  }

  const t1 = BUILTIN_TEXTS.find((t) => t.level === 'B1')!
  const t2 = BUILTIN_TEXTS.find((t) => t.level === 'B2')!

  return (
    <Page title="Placement" actions={step !== 'done' && <Btn kind="ghost" onClick={() => void skip()}>Skip placement</Btn>}>
      {step === 'intro' && (
        <Card>
          <p>
            About 15–20 minutes. First one quick question per grammar topic, getting harder as long as you keep up; then one
            or two timed C-tests. No feedback until the end — this measures you, it doesn't teach yet.
          </p>
          <p className="mt-2 text-sm text-stone-500">
            Skip any question with Esc. Levels you ace (90%+) are marked as tested out so you never waste time on them.
          </p>
          <div className="mt-4">
            <Btn kind="primary" onClick={() => setStep('A2')}>
              Start
            </Btn>
          </div>
        </Card>
      )}
      {(step === 'A2' || step === 'B1' || step === 'B2') && (
        <div>
          <p className="mb-3 text-sm text-stone-500">Grammar check · {step === 'A2' ? 'A1–A2' : step}</p>
          <Drill key={step} items={items[step]} source="placement" mode="test" onDone={(o) => grammarDone(step, o)} />
        </div>
      )}
      {step === 'ctB1' && (
        <div>
          <p className="mb-3 text-sm text-stone-500">C-test · B1 · fill the gaps, then Finish</p>
          <CTestPlayer
            t={{ id: t1.id, title: t1.title, text: t1.text, properNames: t1.properNames ?? [], level: 'B1' }}
            mode="placement"
            gaps={settings.gapCount}
            letterCount={settings.letterCount}
            timeLimit={settings.secondsPerText}
            onFinished={(r) => {
              setCtests([r])
              if (r.correct / r.total >= 0.7) setStep('ctB2')
              else void finish()
            }}
          />
        </div>
      )}
      {step === 'ctB2' && (
        <div>
          <p className="mb-3 text-sm text-stone-500">C-test · B2</p>
          <CTestPlayer
            t={{ id: t2.id, title: t2.title, text: t2.text, properNames: t2.properNames ?? [], level: 'B2' }}
            mode="placement"
            gaps={settings.gapCount}
            letterCount={settings.letterCount}
            timeLimit={settings.secondsPerText}
            onFinished={(r) => {
              setCtests((c) => [...c, r])
              void finish()
            }}
          />
        </div>
      )}
      {step === 'done' && (
        <Card>
          <h2 className="text-lg font-semibold">Your starting point</h2>
          <ul className="mt-3 space-y-1">
            {(['A2', 'B1', 'B2'] as Level[]).map((l) => {
              const o = grammar[l]
              if (!o) return <li key={l} className="text-stone-500">{l === 'A2' ? 'A1–A2' : l} grammar: not reached</li>
              const right = o.filter((x) => x.correct).length
              return (
                <li key={l}>
                  {l === 'A2' ? 'A1–A2' : l} grammar: {right}/{items[l].length}
                  {o.filter((x) => x.correct && !x.assisted).length / items[l].length >= 0.9 && ' — tested out'}
                </li>
              )
            })}
            {ctests.map((r) => (
              <li key={r.id}>
                C-test {r.level}: {r.correct}/{r.total}
              </li>
            ))}
          </ul>
          {Object.values(grammar).some((o) => o?.some((x) => !x.correct)) && (
            <p className="mt-3 text-sm text-stone-600">
              Start with:{' '}
              {Object.values(grammar)
                .flatMap((o) => o ?? [])
                .filter((x) => !x.correct && x.item.topic)
                .slice(0, 6)
                .map((x) => TOPIC_BY_ID.get(x.item.topic!)?.title)
                .join(', ')}
            </p>
          )}
          <div className="mt-4 flex gap-2">
            <Btn kind="primary" onClick={() => nav('/session')}>
              Start today's session
            </Btn>
            <Btn onClick={() => nav('/')}>Dashboard</Btn>
          </div>
        </Card>
      )}
    </Page>
  )
}
