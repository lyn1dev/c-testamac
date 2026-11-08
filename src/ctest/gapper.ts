import { COMMON_PROPER_NAMES } from './properNames'

export type Gap = {
  id: number
  word: string
  prefix: string
  answer: string
  sentence: number
  start: number
  end: number
}

export type CTest = {
  text: string
  sentences: [number, number][]
  gaps: Gap[]
}

export type CTestOptions = { gaps?: number; properNames?: string[] }

const ABBREVIATIONS = new Set([
  'usw', 'bzw', 'ca', 'Dr', 'Prof', 'Nr', 'etc', 'ggf', 'evtl', 'vgl', 'inkl', 'exkl', 'Mio', 'Mrd', 'Str',
  'Jh', 'Jhd', 'bspw', 'sog', 'zz', 'zzt', 'Hr', 'Fr', 'Std', 'Min', 'Tel', 'Abb', 'Kap', 'Bd', 'gegr', 'geb',
  'ehem', 'allg', 'insb', 'Mrs', 'Mr', 'St', 'Abs', 'Art', 'ff',
])
const SENTENCE_END = /[.!?…]+[“”"»«’')\]]*/gu
const WORD = /[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*/gu
const SENTENCE_START = /[\p{Lu}\p{N}„"«»‚'(\[]/u
export const HIDDEN_GAP = '____'

export function splitSentenceRanges(text: string): [number, number][] {
  const ends: number[] = []
  for (const m of text.matchAll(SENTENCE_END)) {
    const idx = m.index
    const stop = idx + m[0].length
    const after = text.slice(stop)
    if (after.trim() === '') {
      ends.push(stop)
      continue
    }
    if (!/^\s/.test(after)) continue
    if (!SENTENCE_START.test(after.trimStart()[0])) continue
    if (m[0].startsWith('.')) {
      const prev = /([\p{L}\p{N}]+)$/u.exec(text.slice(0, idx))?.[1] ?? ''
      const year = /^\p{N}{4}$/u.test(prev)
      if (!year && (/^\p{N}+$/u.test(prev) || [...prev].length === 1 || ABBREVIATIONS.has(prev))) continue
    }
    ends.push(stop)
  }
  const ranges: [number, number][] = []
  let start = 0
  for (const end of ends) {
    ranges.push(trimRange(text, start, end))
    start = end
  }
  if (text.slice(start).trim() !== '') ranges.push(trimRange(text, start, text.length))
  return ranges
}

function trimRange(text: string, start: number, end: number): [number, number] {
  while (start < end && /\s/.test(text[start])) start++
  while (end > start && /\s/.test(text[end - 1])) end--
  return [start, end]
}

export function splitSentences(text: string): string[] {
  const t = text.normalize('NFC')
  return splitSentenceRanges(t).map(([a, b]) => t.slice(a, b))
}

function gappable(word: string, names: Set<string>): boolean {
  return (
    [...word].length > 1 && !/\p{N}/u.test(word) && !word.includes('-') && !/^\p{Lu}+$/u.test(word) && !names.has(word)
  )
}

export function makeCTest(text: string, opts: CTestOptions = {}): CTest {
  const t = text.normalize('NFC').replace(/[\u00AD\u200B-\u200D\u2060\uFEFF]/g, '')
  const max = opts.gaps ?? 20
  const names = new Set(
    [...COMMON_PROPER_NAMES, ...(opts.properNames ?? [])].flatMap((n) => n.normalize('NFC').split(/\s+/)),
  )
  const sentences = splitSentenceRanges(t)
  const gaps: Gap[] = []
  let count = 0
  for (let s = 1; s < sentences.length - 1 && gaps.length < max; s++) {
    const [a, b] = sentences[s]
    for (const m of t.slice(a, b).matchAll(WORD)) {
      if (gaps.length >= max) break
      const word = m[0]
      if (!gappable(word, names)) continue
      count++
      if (count % 2 !== 0) continue
      const letters = [...word]
      const keep = Math.floor(letters.length / 2)
      const start = a + m.index
      gaps.push({
        id: gaps.length,
        word,
        prefix: letters.slice(0, keep).join(''),
        answer: letters.slice(keep).join(''),
        sentence: s,
        start,
        end: start + word.length,
      })
    }
  }
  return { text: t, sentences, gaps }
}

export type Segment = { text: string } | { gap: Gap }

export function segments(ct: CTest): Segment[] {
  const out: Segment[] = []
  let pos = 0
  for (const gap of ct.gaps) {
    out.push({ text: ct.text.slice(pos, gap.start) })
    out.push({ gap })
    pos = gap.end
  }
  out.push({ text: ct.text.slice(pos) })
  return out
}

export function renderCTest(ct: CTest, opts: { letterCount?: boolean } = {}): string {
  const letterCount = opts.letterCount ?? true
  return segments(ct)
    .map((seg) =>
      'gap' in seg
        ? seg.gap.prefix + (letterCount ? '_'.repeat([...seg.gap.answer].length) : HIDDEN_GAP)
        : seg.text,
    )
    .join('')
}

const SPELLING_SWAPS: [string, string][] = [
  ['ä', 'ae'], ['ö', 'oe'], ['ü', 'ue'], ['Ä', 'Ae'], ['Ö', 'Oe'], ['Ü', 'Ue'], ['ß', 'ss'],
]

export type GapGrade = { correct: boolean; spellingHint?: string }

export function gradeGap(gap: Gap, input: string): GapGrade {
  const given = input.normalize('NFC').trim()
  if (given === gap.answer || given === gap.word) return { correct: true }
  const swaps = SPELLING_SWAPS.filter(([real]) => gap.answer.includes(real))
  if (swaps.length === 0) return { correct: false }
  const ascii = swaps.reduce((s, [real, alt]) => s.replaceAll(real, alt), gap.answer)
  if (given.toLowerCase() !== ascii.toLowerCase()) return { correct: false }
  return {
    correct: false,
    spellingHint: `Write ${swaps.map(([r, a]) => `${r}, not ${a}`).join('; ')} — counts as wrong in the exam.`,
  }
}
