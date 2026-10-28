import Dexie, { type EntityTable } from 'dexie'
import type { CTestLevel } from './ctest/texts'
import type { Item } from './practice/items'
import type { Card, Grade } from './practice/srs'
import { newCard, schedule } from './practice/srs'

export type Source = 'practice' | 'review' | 'placement' | 'exam' | 'testout' | 'session' | 'cram'

export type Attempt = {
  id?: number
  at: number
  key: string
  kind: Item['kind']
  topic?: string
  correct: boolean
  assisted: boolean
  source: Source
}

export type GapRecord = {
  word: string
  prefix: string
  given: string
  correct: boolean
  sentence: string
  accepted?: boolean
  reported?: boolean
  explanation?: string
  rule?: string
  trick?: string
  topic?: string
  strategy?: string
}

export type CTestResult = {
  id?: number
  at: number
  textId: string
  title: string
  level: CTestLevel
  mode: 'practice' | 'timed' | 'paste' | 'exam' | 'placement' | 'session'
  correct: number
  total: number
  seconds: number
  assisted: boolean
  repeat?: boolean
  text: string
  properNames: string[]
  gaps: GapRecord[]
  explained?: boolean
}

export type TopicState = { id: string; known?: boolean; testedOutAt?: number; lessonAt?: number }

export type Lookup = { id?: number; at: number; target: string; during?: string }

export type AiText = {
  id: string
  at: number
  level: CTestLevel
  focus?: string
  title: string
  text: string
  properNames: string[]
}

export type Setting = { key: string; value: unknown }

export const db = new Dexie('ctest-coach') as Dexie & {
  attempts: EntityTable<Attempt, 'id'>
  cards: EntityTable<Card, 'key'>
  results: EntityTable<CTestResult, 'id'>
  topics: EntityTable<TopicState, 'id'>
  lookups: EntityTable<Lookup, 'id'>
  aiTexts: EntityTable<AiText, 'id'>
  settings: EntityTable<Setting, 'key'>
}

db.version(1).stores({
  attempts: '++id, at, key, topic, source',
  cards: 'key, due, topic',
  results: '++id, at, level, mode',
  topics: 'id',
  lookups: '++id, at',
  aiTexts: 'id, at, level',
  settings: 'key',
})

db.version(2).stores({ cards: 'key, due, topic, createdAt' })

const NEW_CARDS_FROM_CORRECT_PER_DAY = 20

async function newCardsFromCorrectToday(now: number) {
  const start = new Date(now).setHours(0, 0, 0, 0)
  return db.cards.where('createdAt').aboveOrEqual(start).filter((c) => c.lapses === 0).count()
}

export async function record(item: Item, correct: boolean, opts: { assisted: boolean; source: Source }) {
  const now = Date.now()
  await db.transaction('rw', db.attempts, db.cards, async () => {
    await db.attempts.add({
      at: now,
      key: item.key,
      kind: item.kind,
      topic: item.topic,
      correct,
      assisted: opts.assisted,
      source: opts.source,
    })
    if (opts.source === 'exam' || opts.source === 'placement') {
      if (!correct) await db.cards.put(schedule(newCard(item, now), 'wrong', now))
      return
    }
    const existing = await db.cards.get(item.key)
    if (!existing && correct && (await newCardsFromCorrectToday(now)) >= NEW_CARDS_FROM_CORRECT_PER_DAY) return
    await db.cards.put(schedule(existing ?? newCard(item, now), correct ? 'right' : 'wrong', now))
  })
}

export async function grade(item: Item, g: Grade, now = Date.now()) {
  const existing = await db.cards.get(item.key)
  await db.cards.put(schedule(existing ?? newCard(item, now), g, now))
}

export async function markKnown(item: Item) {
  await grade(item, 'known')
}

export async function setTopic(id: string, patch: Partial<TopicState>) {
  const cur = (await db.topics.get(id)) ?? { id }
  await db.topics.put({ ...cur, ...patch })
}
