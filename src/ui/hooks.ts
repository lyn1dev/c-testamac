import { useLiveQuery } from 'dexie-react-hooks'
import { TOPIC_CATALOG } from '../content/catalog'
import { db, type TopicState } from '../db'
import { masteryByTopic, type Mastery } from '../practice/mastery'

const IDS = TOPIC_CATALOG.map((t) => t.id)

export async function loadMastery(): Promise<Record<string, Mastery>> {
  const [attempts, topics] = await Promise.all([db.attempts.toArray(), db.topics.toArray()])
  return masteryByTopic(IDS, attempts, Object.fromEntries(topics.map((t) => [t.id, t])))
}

export function useMastery(): Record<string, Mastery> | undefined {
  return useLiveQuery(loadMastery)
}

export function useTopicStates(): Record<string, TopicState> | undefined {
  return useLiveQuery(async () => Object.fromEntries((await db.topics.toArray()).map((t) => [t.id, t])))
}

export function useDueCount(): number | undefined {
  return useLiveQuery(() => db.cards.where('due').belowOrEqual(Date.now()).count())
}

export async function introducedTopics(): Promise<string[]> {
  const [topics, attempts] = await Promise.all([db.topics.toArray(), db.attempts.toArray()])
  const ids = new Set(topics.filter((t) => t.lessonAt || t.known || t.testedOutAt).map((t) => t.id))
  for (const a of attempts) if (a.topic) ids.add(a.topic)
  return IDS.filter((id) => ids.has(id))
}

export async function nextNewTopic(): Promise<string | undefined> {
  const [topics, mastery] = await Promise.all([db.topics.toArray(), loadMastery()])
  const state = new Map(topics.map((t) => [t.id, t]))
  return IDS.find((id) => {
    const s = state.get(id)
    return !s?.lessonAt && !s?.known && !s?.testedOutAt && mastery[id]?.status !== 'strong'
  })
}
