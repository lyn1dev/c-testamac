import { conjugate, PERSONS, TENSE_LABELS, type Tense } from '../content/conjugate'
import { checkTransform, exerciseSolution, gapAnswers, matchesAny } from '../content/exercise'
import { TABLE_BY_ID, VERB_BY_INF } from '../content/index'
import type { Exercise, Feedback } from '../content/types'
import { gradeGap, type Gap } from '../ctest/gapper'

export type Item =
  | { kind: 'exercise'; key: string; topic: string; exercise: Exercise }
  | { kind: 'cell'; key: string; topic?: string; tableId: string; r: number; c: number }
  | { kind: 'verb'; key: string; topic?: string; inf: string; tense: Tense; person: number }
  | { kind: 'gap'; key: string; topic?: string; before: string; after: string; gap: Gap; source?: string }

export type Answer = string | number | string[]

export type Result = { correct: boolean; expected: string; fb?: Feedback; hint?: string }

export function exerciseItem(e: Exercise): Item {
  return { kind: 'exercise', key: `ex:${e.id}`, topic: e.topic, exercise: e }
}

export function cellItem(tableId: string, r: number, c: number): Item {
  const t = TABLE_BY_ID.get(tableId)
  return { kind: 'cell', key: `cell:${tableId}:${r}:${c}`, topic: t?.topics[0], tableId, r, c }
}

const TENSE_TOPIC: Partial<Record<Tense, string>> = {
  present: 'present-tense',
  praeteritum: 'praeteritum',
  perfekt: 'perfekt',
  plusquamperfekt: 'plusquamperfekt',
  futur1: 'futur-1',
  konjunktiv2: 'konjunktiv-2',
  konjunktiv1: 'konjunktiv-1',
}

export function verbItem(inf: string, tense: Tense, person: number): Item {
  return { kind: 'verb', key: `verb:${inf}:${tense}:${person}`, topic: TENSE_TOPIC[tense], inf, tense, person }
}

export function gapItem(sentence: string, gap: Gap, topic?: string, source?: string): Item {
  return {
    kind: 'gap',
    key: `gap:${sentence.slice(0, 60)}:${gap.start}`,
    topic,
    before: sentence.slice(0, gap.start),
    after: sentence.slice(gap.end),
    gap: { ...gap, start: 0, end: 0 },
    source,
  }
}

export function cellAnswers(tableId: string, r: number, c: number): string[] {
  const cell = TABLE_BY_ID.get(tableId)?.cells[r]?.[c] ?? ''
  return cell.split('/').map((s) => s.trim())
}

export function verbAnswers(inf: string, tense: Tense, person: number): string[] {
  const v = VERB_BY_INF.get(inf)
  if (!v) return []
  return conjugate(v, tense)[person].split('/')
}

export function verbPrompt(inf: string, tense: Tense, person: number): string {
  return `${inf} · ${PERSONS[person]} · ${TENSE_LABELS[tense]}`
}

export function solution(item: Item): string {
  switch (item.kind) {
    case 'exercise':
      return exerciseSolution(item.exercise)
    case 'cell':
      return cellAnswers(item.tableId, item.r, item.c).join(' / ')
    case 'verb':
      return verbAnswers(item.inf, item.tense, item.person).join(' / ')
    case 'gap':
      return item.gap.word
  }
}

export function checkItem(item: Item, answer: Answer): Result {
  const expected = solution(item)
  switch (item.kind) {
    case 'exercise': {
      const e = item.exercise
      if (e.kind === 'choice') return { correct: answer === e.answer, expected, fb: e.fb }
      if (e.kind === 'transform') return { correct: checkTransform(e, String(answer)), expected, fb: e.fb }
      const given = Array.isArray(answer) ? answer : [String(answer)]
      const correct = gapAnswers(e.text).every((alts, i) => matchesAny(alts, given[i] ?? ''))
      return { correct, expected, fb: e.fb }
    }
    case 'cell':
      return { correct: matchesAny(cellAnswers(item.tableId, item.r, item.c), String(answer)), expected }
    case 'verb':
      return { correct: matchesAny(verbAnswers(item.inf, item.tense, item.person), String(answer)), expected }
    case 'gap': {
      const g = gradeGap(item.gap, String(answer))
      return { correct: g.correct, expected, hint: g.spellingHint }
    }
  }
}
