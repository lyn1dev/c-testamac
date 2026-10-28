import 'fake-indexeddb/auto'
import Dexie from 'dexie'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TOPICS } from './content/index'
import { db, record } from './db'
import { exerciseItem } from './practice/items'
import { dueItems } from './practice/pools'
import { DAY, MINUTE, newCard } from './practice/srs'

const items = TOPICS.flatMap((t) => t.exercises).map(exerciseItem)

beforeEach(async () => {
  await db.delete()
  await db.open()
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(new Date(2026, 9, 1, 12))
})

afterEach(() => vi.useRealTimers())

const practice = { assisted: false, source: 'practice' as const }

describe('upgrade', () => {
  it('keeps version 1 progress', async () => {
    db.close()
    await Dexie.delete('ctest-coach')
    const v1 = new Dexie('ctest-coach')
    v1.version(1).stores({ attempts: '++id, at, key, topic, source', cards: 'key, due, topic', results: '++id, at, level, mode', topics: 'id', lookups: '++id, at', aiTexts: 'id, at, level', settings: 'key' })
    await v1.table('cards').put(newCard(items[0], Date.now()))
    await v1.table('settings').put({ key: 'placementDone', value: true })
    v1.close()
    await db.open()
    expect(await db.cards.get(items[0].key)).toBeDefined()
    expect(await db.cards.where('createdAt').aboveOrEqual(0).count()).toBe(1)
    expect((await db.settings.get('placementDone'))?.value).toBe(true)
  })
})

describe('review queue', () => {
  it('always adds mistakes but caps new cards from correct answers at 20 a day', async () => {
    for (const it of items.slice(0, 25)) await record(it, true, practice)
    expect(await db.cards.count()).toBe(20)

    await record(items[30], false, practice)
    expect(await db.cards.get(items[30].key)).toBeDefined()

    vi.setSystemTime(Date.now() + 5 * DAY)
    await record(items[0], true, practice)
    expect((await db.cards.get(items[0].key))?.reps).toBe(2)

    vi.setSystemTime(new Date(2026, 9, 2, 9))
    await record(items[40], true, practice)
    expect(await db.cards.get(items[40].key)).toBeDefined()
  })

  it('only reschedules a correct, unassisted answer when the card is due', async () => {
    const it = items[0]
    await record(it, true, practice)
    const first = (await db.cards.get(it.key))!
    await record(it, true, practice)
    await record(it, true, { assisted: true, source: 'review' })
    expect(await db.cards.get(it.key)).toEqual(first)
    vi.setSystemTime(first.due + MINUTE)
    await record(it, true, { assisted: true, source: 'review' })
    expect((await db.cards.get(it.key))?.due).toBe(first.due)
    await record(it, true, practice)
    expect((await db.cards.get(it.key))?.reps).toBe(2)
    await record(it, false, practice)
    expect((await db.cards.get(it.key))?.lapses).toBe(1)
    expect(await db.attempts.count()).toBe(6)
  })

  it('serves lapsed cards first, then the most overdue', async () => {
    const now = Date.now()
    const card = (i: number, due: number, reps: number, lapses: number) => ({ ...newCard(items[i], now - 9 * DAY), due, reps, lapses })
    await db.cards.bulkPut([
      card(0, now - 60 * MINUTE, 2, 0),
      card(1, now - 3 * DAY, 2, 0),
      card(2, now - 5 * MINUTE, 0, 1),
      card(3, now + DAY, 2, 0),
    ])
    expect((await dueItems(10)).map((i) => i.key)).toEqual([items[2].key, items[1].key, items[0].key])
  })

  it('serves the current version of an exercise, not the stored copy', async () => {
    const it = items[0]
    if (it.kind !== 'exercise') throw new Error('expected an exercise')
    const stale = { ...it, exercise: { ...it.exercise, fb: { rule: 'old rule', cue: 'old' } } }
    await db.cards.put({ ...newCard(stale, Date.now()), due: Date.now() - MINUTE })
    const [served] = await dueItems(1)
    expect(served.kind === 'exercise' && served.exercise.fb.rule).toBe(it.exercise.fb.rule)
  })
})
