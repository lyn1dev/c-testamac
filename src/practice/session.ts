import type { CTestLevel } from '../ctest/texts'

export type Step =
  | { kind: 'review'; minutes: number; count: number }
  | { kind: 'lesson'; minutes: number; topic: string }
  | { kind: 'ctest'; minutes: number; level: CTestLevel }
  | { kind: 'weak'; minutes: number; topic: string; count: number }
  | { kind: 'mixed'; minutes: number; count: number }

export type SessionInput = {
  minutes: number
  dueCount: number
  nextTopic?: string
  weakestTopic?: string
  level: CTestLevel
}

const PER_REVIEW = 1 / 3
const PER_DRILL = 0.5
const LESSON = 10
const CTEST = 7

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
