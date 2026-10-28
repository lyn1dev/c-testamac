import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { Level } from '../content/types'
import { levelTopics, mixedItems } from '../practice/pools'
import { Btn, Page, useActivity } from '../ui/bits'
import { Drill } from '../ui/Drill'

const LEVELS: Level[] = ['A2', 'B1', 'B2']

export function CramPage() {
  const [params, setParams] = useSearchParams()
  const level = (LEVELS.find((l) => l === params.get('level')) ?? 'B1') as Level
  const [round, setRound] = useState(0)
  const items = useMemo(() => mixedItems(levelTopics(level), 40), [level, round])
  useActivity(`cram:${level}`)
  return (
    <Page
      title={`Cram ${level === 'A2' ? 'A1–A2' : level}`}
      actions={
        <div className="flex gap-2">
          {LEVELS.map((l) => (
            <Btn key={l} kind={l === level ? 'primary' : 'plain'} onClick={() => setParams({ level: l })}>
              {l === 'A2' ? 'A1–A2' : l}
            </Btn>
          ))}
        </div>
      }
    >
      <p className="mb-4 text-sm text-stone-600">
        40 exercises from every topic of the level, interleaved. Rapid mode: correct answers advance on their own.
      </p>
      <Drill key={`${level}-${round}`} items={items} source="cram" mode="rapid" />
      <div className="mt-3">
        <Btn onClick={() => setRound((r) => r + 1)}>New round</Btn>
      </div>
    </Page>
  )
}
