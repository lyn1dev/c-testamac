import { describe, expect, it } from 'vitest'
import { estimateScores, recommendedLevel, type ResultLike } from './estimate'
import { topicMastery, weakestTopics } from './mastery'
import { planSession } from './session'
import { DAY, MINUTE, newCard, schedule } from './srs'
import type { Item } from './items'

const item: Item = { kind: 'verb', key: 'verb:gehen:perfekt:2', inf: 'gehen', tense: 'perfekt', person: 2 }

describe('srs', () => {
  it('brings wrong answers back in minutes and grows intervals when right', () => {
    const now = 1_000_000
    let c = schedule(newCard(item, now), 'wrong', now)
    expect(c.due).toBe(now + 10 * MINUTE)
    expect(c.lapses).toBe(1)
    c = schedule(c, 'right', now)
    expect(c.interval).toBe(1)
    c = schedule(c, 'right', now)
    expect(c.interval).toBe(3)
    c = schedule(c, 'right', now)
    expect(c.interval).toBeGreaterThan(6)
  })

  it('skips ahead for items known on first sight', () => {
    const now = 0
    expect(schedule(newCard(item, now), 'right', now).interval).toBe(4)
    expect(schedule(newCard(item, now), 'known', now).due).toBe(30 * DAY)
  })
})

describe('mastery', () => {
  const a = (correct: boolean, at: number, assisted = false) => ({ at, correct, assisted, topic: 't' })

  it('is new without attempts and ignores assisted attempts', () => {
    expect(topicMastery([]).status).toBe('new')
    expect(topicMastery([a(true, 1, true), a(true, 2, true)]).status).toBe('new')
  })

  it('weights recent attempts more', () => {
    const improving = [a(false, 1), a(false, 2), a(true, 3), a(true, 4), a(true, 5)]
    const declining = [a(true, 1), a(true, 2), a(true, 3), a(false, 4), a(false, 5)]
    expect(topicMastery(improving).score).toBeGreaterThan(topicMastery(declining).score)
  })

  it('treats a tested-out topic as strong until mistakes pile up', () => {
    expect(topicMastery([], { testedOutAt: 1 }).status).toBe('strong')
    const wrongs = Array.from({ length: 6 }, (_, i) => a(false, i + 2))
    expect(topicMastery(wrongs, { testedOutAt: 1 }).status).toBe('weak')
  })

  it('lists weakest practised topics first', () => {
    const m = {
      x: topicMastery([a(false, 1), a(true, 2)]),
      y: topicMastery([a(false, 1), a(false, 2)]),
      z: topicMastery([]),
    }
    expect(weakestTopics(m)).toEqual(['y', 'x'])
  })
})

describe('estimates', () => {
  const r = (level: ResultLike['level'], correct: number, at: number, assisted = false): ResultLike => ({
    level,
    correct,
    total: 20,
    at,
    assisted,
  })

  it('uses recent unassisted texts per level', () => {
    const e = estimateScores([r('B1', 16, 1), r('B1', 18, 2), r('B1', 0, 3, true)], {}, {})
    expect(e.B1).toEqual({ value: 85, basis: 'texts', n: 2 })
    expect(e.B2.value).toBe(73)
  })

  it('has no estimate without data', () => {
    expect(estimateScores([], {}, {}).B2.basis).toBe('none')
  })

  it('moves the level up after strong results and down after weak ones', () => {
    expect(recommendedLevel([])).toBe('B1')
    expect(recommendedLevel([r('B1', 18, 1), r('B1', 19, 2)])).toBe('B2')
    expect(recommendedLevel([r('B2', 9, 1)])).toBe('B1')
    expect(recommendedLevel([r('B2', 14, 1)])).toBe('B2')
  })
})

describe('session planner', () => {
  it('fits reviews, a lesson, C-tests and weak-area practice into the time', () => {
    const steps = planSession({ minutes: 45, dueCount: 30, nextTopic: 'perfekt', weakestTopic: 'cases', level: 'B1' })
    expect(steps.map((s) => s.kind)).toEqual(['review', 'lesson', 'ctest', 'ctest', 'weak'])
    expect(steps.reduce((s, x) => s + x.minutes, 0)).toBeLessThanOrEqual(45)
  })

  it('keeps short sessions to the essentials', () => {
    const steps = planSession({ minutes: 10, dueCount: 0, nextTopic: 'perfekt', level: 'B2' })
    expect(steps.map((s) => s.kind)).toEqual(['ctest', 'mixed'])
  })
})
