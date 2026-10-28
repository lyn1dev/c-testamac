import { TOPIC_CATALOG } from './catalog'
import { TABLES } from './tables'
import type { Exercise, GrammarTable, Topic } from './types'
import { VERBS } from './verbs'

const modules = import.meta.glob<{ topic: Topic }>('./topics/*.ts', { eager: true })
const loaded = Object.values(modules).map((m) => m.topic)

export const TOPICS: Topic[] = TOPIC_CATALOG.flatMap((e) => loaded.filter((t) => t.id === e.id))
export const TOPIC_BY_ID = new Map(TOPICS.map((t) => [t.id, t]))
export const TABLE_BY_ID = new Map<string, GrammarTable>(TABLES.map((t) => [t.id, t]))
export const EXERCISE_BY_ID = new Map<string, Exercise>(
  TOPICS.flatMap((t) => t.exercises.map((e) => [e.id, e] as const)),
)
export const VERB_BY_INF = new Map(VERBS.map((v) => [v.inf, v]))

export { TABLES, VERBS }
