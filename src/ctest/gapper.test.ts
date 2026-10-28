import { describe, expect, it } from 'vitest'
import { gradeGap, makeCTest, renderCTest, splitSentences } from './gapper'

const EXAMPLE =
  'Viele junge Menschen aus dem Ausland möchten in Deutschland studieren. Vorher müssen sie aber oft ein Studienkolleg besuchen. Dort lernen sie die Sprache und die wichtigsten Fächer. Danach können sie an einer Universität studieren.'

describe('makeCTest', () => {
  it('gaps the worked example exactly', () => {
    const ct = makeCTest(EXAMPLE, { gaps: 8 })
    expect(renderCTest(ct)).toBe(
      'Viele junge Menschen aus dem Ausland möchten in Deutschland studieren. Vorher müs___ sie ab__ oft e__ Studienkolleg besu____. Dort ler___ sie d__ Sprache u__ die wicht______ Fächer. Danach können sie an einer Universität studieren.',
    )
    expect(ct.gaps.map((g) => g.answer)).toEqual(['sen', 'er', 'in', 'chen', 'nen', 'ie', 'nd', 'igsten'])
  })

  it('defaults to 20 gaps', () => {
    const long = [
      'Das ist der erste Satz.',
      ...Array.from({ length: 10 }, () => 'Wir lesen heute viele gute Bücher im Unterricht.'),
      'Das ist der letzte Satz.',
    ].join(' ')
    const ct = makeCTest(long)
    expect(ct.gaps).toHaveLength(20)
    expect(renderCTest(ct).endsWith('Das ist der letzte Satz.')).toBe(true)
  })

  it('counts umlauts and ß as one letter, also in decomposed input', () => {
    const text = 'Erster Satz bleibt. Wir heißen alle Müller. Letzter Satz.'
    const nfd = text.normalize('NFD')
    for (const t of [text, nfd]) {
      const ct = makeCTest(t, { gaps: 2, properNames: ['Müller'] })
      expect(ct.gaps.map((g) => [g.prefix, g.answer])).toEqual([['hei', 'ßen']])
    }
    const ct = makeCTest('Erster Satz bleibt. Sie können über Brücken gehen. Ende.', { gaps: 2 })
    expect(renderCTest(ct)).toBe('Erster Satz bleibt. Sie kön___ über Brü____ gehen. Ende.')
  })

  it('takes the larger half from odd-length words', () => {
    const ct = makeCTest('Erster Satz. Er kauft immer Brot. Ende.', { gaps: 5 })
    expect(renderCTest(ct)).toBe('Erster Satz. Er ka___ immer Br__. Ende.')
  })

  it('skips one-letter words, numbers and proper names without counting them', () => {
    const ct = makeCTest('Erster Satz. Anna wohnt seit 2019 in Berlin, a ganz nah am Rhein. Ende.', {
      gaps: 10,
      properNames: ['Anna', 'Rhein'],
    })
    expect(ct.gaps.map((g) => g.word)).toEqual(['seit', 'ganz', 'am'])
    expect(renderCTest(ct)).toBe('Erster Satz. Anna wohnt se__ 2019 in Berlin, a ga__ nah a_ Rhein. Ende.')
  })

  it('treats common place names as proper names by default', () => {
    const ct = makeCTest('Erster Satz. Sie fahren nach Deutschland und Österreich. Ende.', { gaps: 10 })
    expect(ct.gaps.map((g) => g.word)).toEqual(['fahren', 'und'])
  })

  it('keeps first and last sentence intact even when gaps run short', () => {
    const ct = makeCTest('Eins zwei drei. Vier fünf sechs. Sieben acht neun.', { gaps: 20 })
    expect(renderCTest(ct)).toBe('Eins zwei drei. Vier fü__ sechs. Sieben acht neun.')
    expect(ct.gaps).toHaveLength(1)
  })

  it('stops after N gaps and leaves the rest ungapped', () => {
    const ct = makeCTest(EXAMPLE, { gaps: 3 })
    expect(renderCTest(ct)).toBe(
      'Viele junge Menschen aus dem Ausland möchten in Deutschland studieren. Vorher müs___ sie ab__ oft e__ Studienkolleg besuchen. Dort lernen sie die Sprache und die wichtigsten Fächer. Danach können sie an einer Universität studieren.',
    )
  })

  it('skips all-caps acronyms without counting them', () => {
    const ct = makeCTest('Erster Satz. Die KI und die EU regeln heute vieles. Ende.', { gaps: 10 })
    expect(ct.gaps.map((g) => g.word)).toEqual(['und', 'regeln', 'vieles'])
  })

  it('skips hyphenated words as one unit without counting them', () => {
    const ct = makeCTest('Erster Satz. Ich schreibe eine E-Mail an meine Lehrerin. Ende.', { gaps: 10 })
    expect(ct.gaps.map((g) => g.word)).toEqual(['schreibe', 'an', 'Lehrerin'])
    expect(renderCTest(ct)).toContain('eine E-Mail a_ meine')
  })

  it('gaps ordinary nouns that are also surnames', () => {
    const ct = makeCTest('Erster Satz. Der alte Fischer sitzt am Bach. Ende.', { gaps: 10 })
    expect(ct.gaps.map((g) => g.word)).toEqual(['alte', 'sitzt', 'Bach'])
  })

  it('can hide the letter count', () => {
    const ct = makeCTest(EXAMPLE, { gaps: 1 })
    expect(renderCTest(ct, { letterCount: false })).toContain('Vorher müs____ sie')
  })
})

describe('splitSentences', () => {
  it('does not split on abbreviations or ordinals', () => {
    expect(
      splitSentences('Man braucht z. B. Geld usw. für das Studium. Am 3. Mai beginnt es. Dr. Weber kommt!'),
    ).toEqual(['Man braucht z. B. Geld usw. für das Studium.', 'Am 3. Mai beginnt es.', 'Dr. Weber kommt!'])
  })

  it('ends a sentence after a year', () => {
    expect(splitSentences('Er kam im Jahr 2019. Danach blieb er. Am 3. Mai ging er.')).toEqual([
      'Er kam im Jahr 2019.',
      'Danach blieb er.',
      'Am 3. Mai ging er.',
    ])
  })

  it('splits on question and exclamation marks and keeps closing quotes', () => {
    expect(splitSentences('Kommst du? „Ja!“ Dann los.')).toEqual(['Kommst du?', '„Ja!“', 'Dann los.'])
  })
})

describe('gradeGap', () => {
  const ct = makeCTest('Erster Satz. Wir müssen über Straßen gehen. Ende.', { gaps: 2 })
  const [mussen, strassen] = ct.gaps

  it('accepts the exact missing part or the whole word', () => {
    expect(gradeGap(mussen, 'sen').correct).toBe(true)
    expect(gradeGap(mussen, ' sen ').correct).toBe(true)
    expect(gradeGap(strassen, 'aßen').correct).toBe(true)
    expect(gradeGap(strassen, 'Straßen').correct).toBe(true)
  })

  it('rejects ae/oe/ue/ss spellings and flags them', () => {
    expect(strassen.prefix).toBe('Str')
    const r = gradeGap(strassen, 'assen')
    expect(r.correct).toBe(false)
    expect(r.spellingHint).toMatch(/ß/)
    const schoen = makeCTest('Erster Satz. Es ist sehr schön. Ende.', { gaps: 2 }).gaps[1]
    expect([schoen.prefix, schoen.answer]).toEqual(['sc', 'hön'])
    expect(gradeGap(schoen, 'hön').correct).toBe(true)
    const r2 = gradeGap(schoen, 'hoen')
    expect(r2.correct).toBe(false)
    expect(r2.spellingHint).toMatch(/ö/)
  })

  it('is case-sensitive and rejects wrong answers', () => {
    expect(gradeGap(mussen, 'SEN').correct).toBe(false)
    expect(gradeGap(mussen, 'ssen').correct).toBe(false)
    expect(gradeGap(mussen, '').correct).toBe(false)
  })
})
