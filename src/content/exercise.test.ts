import { describe, expect, it } from 'vitest'
import { checkTransform, fillGaps, gapAnswers, matchesAny, parseGapText } from './exercise'
import type { TransformExercise } from './types'

describe('gap exercises', () => {
  it('parses markers inside words and alternatives', () => {
    const t = 'Ich habe ein{en} neu{en} Laptop {gekauft|bekommen}.'
    expect(parseGapText(t)).toEqual([
      { text: 'Ich habe ein' },
      { answers: ['en'] },
      { text: ' neu' },
      { answers: ['en'] },
      { text: ' Laptop ' },
      { answers: ['gekauft', 'bekommen'] },
      { text: '.' },
    ])
    expect(gapAnswers(t)).toHaveLength(3)
    expect(fillGaps(t)).toBe('Ich habe einen neuen Laptop gekauft.')
  })

  it('matches exactly, ignoring surrounding whitespace only', () => {
    expect(matchesAny(['dem'], ' dem ')).toBe(true)
    expect(matchesAny(['Straße'], 'Strasse')).toBe(false)
    expect(matchesAny(['dem'], 'Dem')).toBe(false)
    expect(matchesAny(['dem'], '')).toBe(false)
  })
})

describe('transform exercises', () => {
  const ex: TransformExercise = {
    id: 'x',
    topic: 'passive',
    kind: 'transform',
    instruction: 'Passive',
    source: 'Man baut das Haus.',
    answers: ['Das Haus wird gebaut.'],
    fb: { rule: '', cue: '' },
  }
  it('ignores final punctuation and extra spaces but not words', () => {
    expect(checkTransform(ex, 'Das  Haus wird gebaut')).toBe(true)
    expect(checkTransform(ex, 'Das Haus wird gebaut!')).toBe(true)
    expect(checkTransform(ex, 'Das Haus wurde gebaut.')).toBe(false)
  })
})
