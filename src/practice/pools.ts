import { TENSES, type Tense } from '../content/conjugate'
import { TABLE_BY_ID, TOPICS, VERBS } from '../content/index'
import type { Level } from '../content/types'
import { db } from '../db'
import { cellItem, exerciseItem, verbItem, type Item } from './items'
import type { Card } from './srs'

export function shuffle<T>(xs: T[]): T[] {
  const a = [...xs]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function topicItems(id: string): Item[] {
  return TOPICS.find((t) => t.id === id)?.exercises.map(exerciseItem) ?? []
}

export function interleaved(topic: string, others: string[], count: number): Item[] {
  const own = shuffle(topicItems(topic)).slice(0, Math.ceil(count * 0.7))
  const mixed = shuffle(others.filter((o) => o !== topic).flatMap(topicItems)).slice(0, count - own.length)
  return shuffle([...own, ...mixed])
}

export function mixedItems(topics: string[], count: number): Item[] {
  const per = new Map(topics.map((t) => [t, shuffle(topicItems(t))]))
  const out: Item[] = []
  while (out.length < count && [...per.values()].some((l) => l.length > 0)) {
    for (const t of shuffle(topics)) {
      const next = per.get(t)?.pop()
      if (next) out.push(next)
      if (out.length >= count) break
    }
  }
  return out
}

export function levelTopics(level: Level): string[] {
  return TOPICS.filter((t) => t.level === level).map((t) => t.id)
}

export function tableItems(tableId: string): Item[] {
  const t = TABLE_BY_ID.get(tableId)
  if (!t) return []
  return t.cells.flatMap((row, r) =>
    row.flatMap((cell, c) => (cell.trim() === '' || cell.trim() === '–' ? [] : [cellItem(tableId, r, c)])),
  )
}

export function verbItems(opts: { group?: string; kind?: string; tenses?: Tense[]; count: number }): Item[] {
  const verbs = VERBS.filter((v) => (!opts.group || v.group === opts.group) && (!opts.kind || v.kind === opts.kind))
  const tenses = opts.tenses?.length ? opts.tenses : [...TENSES]
  const out: Item[] = []
  for (let i = 0; i < opts.count * 3 && out.length < opts.count && verbs.length > 0; i++) {
    const v = verbs[Math.floor(Math.random() * verbs.length)]
    const tense = tenses[Math.floor(Math.random() * tenses.length)]
    const person = tense === 'konjunktiv1' || Math.random() < 0.5 ? 2 : Math.floor(Math.random() * 6)
    const it = verbItem(v.inf, tense, person)
    if (!out.some((x) => x.key === it.key)) out.push(it)
  }
  return out
}

export async function dueItems(limit: number, now = Date.now()): Promise<Item[]> {
  const cards = await db.cards.where('due').belowOrEqual(now).toArray()
  const lapsed = (c: Card) => (c.reps === 0 && c.lapses > 0 ? 0 : 1)
  return cards
    .sort((a, b) => lapsed(a) - lapsed(b) || a.due - b.due)
    .slice(0, limit)
    .map((c) => c.item)
}
