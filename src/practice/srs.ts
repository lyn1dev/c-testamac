import type { Item } from './items'

export type Card = {
  key: string
  item: Item
  topic?: string
  due: number
  interval: number
  ease: number
  reps: number
  lapses: number
  createdAt: number
}

export const MINUTE = 60_000
export const DAY = 86_400_000

export function newCard(item: Item, now: number): Card {
  return { key: item.key, item, topic: item.topic, due: now, interval: 0, ease: 2.5, reps: 0, lapses: 0, createdAt: now }
}

export type Grade = 'wrong' | 'right' | 'known'

export function schedule(card: Card, grade: Grade, now: number): Card {
  if (grade === 'wrong') {
    return {
      ...card,
      reps: 0,
      lapses: card.lapses + 1,
      interval: 0,
      ease: Math.max(1.3, card.ease - 0.2),
      due: now + 10 * MINUTE,
    }
  }
  if (grade === 'known') {
    const interval = Math.max(30, card.interval * 3)
    return { ...card, reps: card.reps + 1, interval, ease: Math.min(3, card.ease + 0.15), due: now + interval * DAY }
  }
  const reps = card.reps + 1
  const firstTry = card.reps === 0 && card.lapses === 0
  const interval =
    reps === 1 ? (firstTry ? 4 : 1) : reps === 2 ? Math.max(3, card.interval * 2) : Math.round(card.interval * card.ease)
  return { ...card, reps, interval, ease: Math.min(3, card.ease + 0.05), due: now + interval * DAY }
}

export function isDue(card: Card, now: number): boolean {
  return card.due <= now
}
