import type { CTestLevel } from '../ctest/texts'
import type { Mastery } from './mastery'

export type ResultLike = { at: number; level: CTestLevel; correct: number; total: number; assisted: boolean }
export type Estimate = { value: number | null; basis: 'texts' | 'grammar' | 'none'; n: number }

const RECENT = 5

function recentPct(results: ResultLike[], levels: CTestLevel[]): { pct: number; n: number } | null {
  const r = results
    .filter((x) => !x.assisted && x.total > 0 && levels.includes(x.level))
    .sort((a, b) => b.at - a.at)
    .slice(0, RECENT)
  if (r.length === 0) return null
  const correct = r.reduce((s, x) => s + x.correct, 0)
  const total = r.reduce((s, x) => s + x.total, 0)
  return { pct: (100 * correct) / total, n: r.length }
}

function grammarPct(mastery: Record<string, Mastery>, topicLevels: Record<string, string>, levels: string[]) {
  const ms = Object.entries(mastery).filter(([id, m]) => levels.includes(topicLevels[id]) && m.n > 0)
  if (ms.length < 3) return null
  return (100 * ms.reduce((s, [, m]) => s + m.score, 0)) / ms.length
}

const LEVEL_GAP = 12

export function estimateScores(
  results: ResultLike[],
  mastery: Record<string, Mastery>,
  topicLevels: Record<string, string>,
): { B1: Estimate; B2: Estimate } {
  const b1 = recentPct(results, ['B1'])
  const b2 = recentPct(results, ['B2', 'B2+'])
  const clamp = (x: number) => Math.round(Math.max(0, Math.min(100, x)))
  const fromGrammar = (levels: string[]): Estimate => {
    const g = grammarPct(mastery, topicLevels, levels)
    return g === null ? { value: null, basis: 'none', n: 0 } : { value: clamp(g), basis: 'grammar', n: 0 }
  }
  return {
    B1: b1
      ? { value: clamp(b1.pct), basis: 'texts', n: b1.n }
      : b2
        ? { value: clamp(b2.pct + LEVEL_GAP), basis: 'texts', n: b2.n }
        : fromGrammar(['A2', 'B1']),
    B2: b2
      ? { value: clamp(b2.pct), basis: 'texts', n: b2.n }
      : b1
        ? { value: clamp(b1.pct - LEVEL_GAP), basis: 'texts', n: b1.n }
        : fromGrammar(['B1', 'B2']),
  }
}

const LADDER: CTestLevel[] = ['B1', 'B2', 'B2+']

export function recommendedLevel(results: ResultLike[], current: CTestLevel = 'B1'): CTestLevel {
  const recent = results
    .filter((x) => !x.assisted && x.total > 0)
    .sort((a, b) => b.at - a.at)
    .slice(0, 3)
  if (recent.length === 0) return current
  const level = recent[0].level
  const same = recent.filter((r) => r.level === level)
  const pct = (100 * same.reduce((s, x) => s + x.correct, 0)) / same.reduce((s, x) => s + x.total, 0)
  const i = LADDER.indexOf(level)
  if (pct >= 85 && same.length >= 2) return LADDER[Math.min(i + 1, LADDER.length - 1)]
  if (pct < 55) return LADDER[Math.max(i - 1, 0)]
  return level
}
