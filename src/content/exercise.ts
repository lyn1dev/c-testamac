import type { Exercise, TransformExercise } from './types'

export type GapPart = { text: string } | { answers: string[] }

export function parseGapText(text: string): GapPart[] {
  const parts: GapPart[] = []
  let pos = 0
  for (const m of text.matchAll(/\{([^{}]+)\}/g)) {
    if (m.index > pos) parts.push({ text: text.slice(pos, m.index) })
    parts.push({ answers: m[1].split('|').map((a) => a.trim()) })
    pos = m.index + m[0].length
  }
  if (pos < text.length) parts.push({ text: text.slice(pos) })
  return parts
}

export function gapAnswers(text: string): string[][] {
  return parseGapText(text).flatMap((p) => ('answers' in p ? [p.answers] : []))
}

export function fillGaps(text: string): string {
  return parseGapText(text)
    .map((p) => ('answers' in p ? p.answers[0] : p.text))
    .join('')
}

export function normalize(s: string): string {
  return s.normalize('NFC').replace(/\s+/g, ' ').trim()
}

function normalizeSentence(s: string): string {
  return normalize(s)
    .replace(/[„“”"]/g, '"')
    .replace(/[’‘]/g, "'")
    .replace(/\s*([.!?])+$/, '')
    .replace(/\s+([,;:])/g, '$1')
}

export function matchesAny(answers: string[], input: string): boolean {
  const given = normalize(input)
  return given !== '' && answers.some((a) => normalize(a) === given)
}

export function checkTransform(ex: TransformExercise, input: string): boolean {
  const given = normalizeSentence(input)
  return given !== '' && ex.answers.some((a) => normalizeSentence(a) === given)
}

export function exerciseSolution(ex: Exercise): string {
  if (ex.kind === 'gap') return fillGaps(ex.text)
  if (ex.kind === 'choice') return ex.options[ex.answer]
  return ex.answers[0]
}
