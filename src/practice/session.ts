import type { CTestLevel } from '../ctest/texts'

export type Step =
  | { kind: 'review'; minutes: number; count: number }
  | { kind: 'lesson'; minutes: number; topic: string }
  | { kind: 'ctest'; minutes: number; level: CTestLevel }
  | { kind: 'weak'; minutes: number; topic: string; count: number }
  | { kind: 'mixed'; minutes: number; count: number }
  | { kind: 'table'; minutes: number; tableId: string; count: number }
  | { kind: 'write'; minutes: number; topic: string }

export type SessionInput = {
  minutes: number
  dueCount: number
  nextTopic?: string
  weakestTopic?: string
  level: CTestLevel
  tableId?: string
  writeTopic?: string
}

const PER_REVIEW = 1 / 3
const PER_DRILL = 0.5
const LESSON = 10
const CTEST = 7
const TABLE_ROUND = 3
const WRITE = 5

export function planSession(input: SessionInput): Step[] {
  const steps: Step[] = []
  let left = input.minutes
  if (input.dueCount > 0) {
    const minutes = Math.min(Math.ceil(input.dueCount * PER_REVIEW), Math.max(3, Math.round(left * 0.3)))
    steps.push({ kind: 'review', minutes, count: Math.floor(minutes / PER_REVIEW) })
    left -= minutes
  }
  if (input.nextTopic && left >= LESSON + CTEST) {
    steps.push({ kind: 'lesson', minutes: LESSON, topic: input.nextTopic })
    left -= LESSON
  }
  const texts = Math.max(left >= CTEST ? 1 : 0, Math.floor((left * 0.6) / CTEST))
  for (let i = 0; i < texts; i++) steps.push({ kind: 'ctest', minutes: CTEST, level: input.level })
  left -= texts * CTEST
  if (input.tableId && left >= TABLE_ROUND) {
    steps.push({ kind: 'table', minutes: TABLE_ROUND, tableId: input.tableId, count: 15 })
    left -= TABLE_ROUND
  }
  if (input.writeTopic && left >= WRITE) {
    steps.push({ kind: 'write', minutes: WRITE, topic: input.writeTopic })
    left -= WRITE
  }
  if (left >= 3) {
    const count = Math.floor(left / PER_DRILL)
    steps.push(
      input.weakestTopic
        ? { kind: 'weak', minutes: left, topic: input.weakestTopic, count }
        : { kind: 'mixed', minutes: left, count },
    )
  }
  return steps
}
