export type AttemptLike = { at: number; topic?: string; correct: boolean; assisted: boolean }
export type TopicFlags = { known?: boolean; testedOutAt?: number }

export type MasteryStatus = 'new' | 'weak' | 'learning' | 'strong'
export type Mastery = { score: number; n: number; status: MasteryStatus }

const WINDOW = 20
const DECAY = 0.85

export function topicMastery(attempts: AttemptLike[], flags: TopicFlags = {}): Mastery {
  const counted = attempts
    .filter((a) => !a.assisted)
    .sort((a, b) => b.at - a.at)
    .slice(0, WINDOW)
  const prior = flags.known || flags.testedOutAt ? 5 : 0
  if (counted.length === 0 && prior === 0) return { score: 0, n: 0, status: 'new' }
  let sum = 0
  let weight = 0
  counted.forEach((a, i) => {
    const w = DECAY ** i
    sum += a.correct ? w : 0
    weight += w
  })
  const priorWeight = prior * DECAY ** counted.length
  sum += priorWeight
  weight += priorWeight
  const score = sum / weight
  const n = counted.length
  const status: MasteryStatus = score < 0.5 ? 'weak' : score >= 0.8 && (n >= 4 || prior > 0) ? 'strong' : 'learning'
  return { score, n, status }
}

export function masteryByTopic(
  topicIds: string[],
  attempts: AttemptLike[],
  flags: Record<string, TopicFlags>,
): Record<string, Mastery> {
  const byTopic = new Map<string, AttemptLike[]>()
  for (const a of attempts) {
    if (!a.topic) continue
    const list = byTopic.get(a.topic) ?? []
    list.push(a)
    byTopic.set(a.topic, list)
  }
  return Object.fromEntries(topicIds.map((id) => [id, topicMastery(byTopic.get(id) ?? [], flags[id])]))
}

export function weakestTopics(mastery: Record<string, Mastery>, limit = 5): string[] {
  return Object.entries(mastery)
    .filter(([, m]) => m.n > 0 && m.status !== 'strong')
    .sort((a, b) => a[1].score - b[1].score)
    .slice(0, limit)
    .map(([id]) => id)
}
