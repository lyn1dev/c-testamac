import { describe, expect, it } from 'vitest'
import { conjugate } from './conjugate'
import { TABLE_BY_ID, VERB_BY_INF } from './index'

const CASES = ['Nominativ', 'Akkusativ', 'Dativ', 'Genitiv']
const GENDERS = ['Maskulin', 'Feminin', 'Neutrum', 'Plural']
const PERSONS6 = ['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie']

function table(id: string) {
  const t = TABLE_BY_ID.get(id)
  if (!t) throw new Error(`missing table ${id}`)
  return t
}

function cell(id: string, row: string, col: string): string[] {
  const t = table(id)
  const r = t.rows.indexOf(row)
  const c = t.cols.indexOf(col)
  if (r < 0 || c < 0) throw new Error(`${id}: no cell ${row}/${col}`)
  return t.cells[r][c].split('/').map((s) => s.trim())
}

function grid(id: string, rows: string[], cols: string[], expected: string[][]) {
  expect(table(id).rows).toEqual(rows)
  expect(table(id).cols).toEqual(cols)
  rows.forEach((r, i) => cols.forEach((c, j) => expect(cell(id, r, c), `${id} ${r}/${c}`).toContain(expected[i][j])))
}

describe('case tables', () => {
  it('definite article', () =>
    grid('def-article', CASES, GENDERS, [
      ['der', 'die', 'das', 'die'],
      ['den', 'die', 'das', 'die'],
      ['dem', 'der', 'dem', 'den'],
      ['des', 'der', 'des', 'der'],
    ]))

  it('indefinite article with kein in the plural', () =>
    grid('indef-article', CASES, GENDERS, [
      ['ein', 'eine', 'ein', 'keine'],
      ['einen', 'eine', 'ein', 'keine'],
      ['einem', 'einer', 'einem', 'keinen'],
      ['eines', 'einer', 'eines', 'keiner'],
    ]))

  it('weak adjective endings and the five -e boxes', () => {
    grid('adj-weak', CASES, GENDERS, [
      ['e', 'e', 'e', 'en'],
      ['en', 'e', 'e', 'en'],
      ['en', 'en', 'en', 'en'],
      ['en', 'en', 'en', 'en'],
    ])
    expect(new Set((table('adj-weak').highlight ?? []).map(String))).toEqual(
      new Set(['0,0', '0,1', '0,2', '1,1', '1,2']),
    )
  })

  it('mixed adjective endings', () =>
    grid('adj-mixed', CASES, GENDERS, [
      ['er', 'e', 'es', 'en'],
      ['en', 'e', 'es', 'en'],
      ['en', 'en', 'en', 'en'],
      ['en', 'en', 'en', 'en'],
    ]))

  it('strong adjective endings', () =>
    grid('adj-strong', CASES, GENDERS, [
      ['er', 'e', 'es', 'e'],
      ['en', 'e', 'es', 'e'],
      ['em', 'er', 'em', 'en'],
      ['en', 'er', 'en', 'er'],
    ]))

  it('relative pronouns', () =>
    grid('relative-pronouns', CASES, GENDERS, [
      ['der', 'die', 'das', 'die'],
      ['den', 'die', 'das', 'die'],
      ['dem', 'der', 'dem', 'denen'],
      ['dessen', 'deren', 'dessen', 'deren'],
    ]))

  it('personal and reflexive pronouns', () => {
    const rows = ['ich', 'du', 'er', 'sie (sg.)', 'es', 'wir', 'ihr', 'sie (pl.)', 'Sie']
    grid('personal-pronouns', rows, ['Nominativ', 'Akkusativ', 'Dativ'], [
      ['ich', 'mich', 'mir'],
      ['du', 'dich', 'dir'],
      ['er', 'ihn', 'ihm'],
      ['sie', 'sie', 'ihr'],
      ['es', 'es', 'ihm'],
      ['wir', 'uns', 'uns'],
      ['ihr', 'euch', 'euch'],
      ['sie', 'sie', 'ihnen'],
      ['Sie', 'Sie', 'Ihnen'],
    ])
    grid('reflexive-pronouns', rows, ['Akkusativ', 'Dativ'], [
      ['mich', 'mir'],
      ['dich', 'dir'],
      ['sich', 'sich'],
      ['sich', 'sich'],
      ['sich', 'sich'],
      ['uns', 'uns'],
      ['euch', 'euch'],
      ['sich', 'sich'],
      ['sich', 'sich'],
    ])
  })

  it('n-Deklination', () =>
    grid('n-declension', CASES, ['Singular', 'Plural'], [
      ['der Kollege', 'die Kollegen'],
      ['den Kollegen', 'die Kollegen'],
      ['dem Kollegen', 'den Kollegen'],
      ['des Kollegen', 'der Kollegen'],
    ]))
})

describe('verb tables', () => {
  it('sein, haben, werden', () =>
    grid('sein-haben-werden', PERSONS6, ['sein', 'haben', 'werden'], [
      ['bin', 'habe', 'werde'],
      ['bist', 'hast', 'wirst'],
      ['ist', 'hat', 'wird'],
      ['sind', 'haben', 'werden'],
      ['seid', 'habt', 'werdet'],
      ['sind', 'haben', 'werden'],
    ]))

  it('modal verbs', () => {
    expect(cell('modal-present', 'du', 'dürfen')).toContain('darfst')
    expect(cell('modal-present', 'ich', 'wollen')).toContain('will')
    expect(cell('modal-present', 'er/sie/es', 'mögen')).toContain('mag')
    expect(cell('modal-present', 'ihr', 'müssen')).toContain('müsst')
    expect(cell('modal-present', 'er/sie/es', 'möchten')).toContain('möchte')
    expect(cell('modal-present', 'du', 'sollen')).toContain('sollst')
    expect(cell('modal-present', 'ich', 'können')).toContain('kann')
  })

  it('Konjunktiv II', () => {
    expect(cell('konjunktiv-2', 'er/sie/es', 'sein')).toContain('wäre')
    expect(cell('konjunktiv-2', 'du', 'haben')).toContain('hättest')
    expect(cell('konjunktiv-2', 'wir', 'werden')).toContain('würden')
    expect(cell('konjunktiv-2', 'ich', 'können')).toContain('könnte')
    expect(cell('konjunktiv-2', 'ihr', 'müssen')).toContain('müsstet')
    expect(cell('konjunktiv-2', 'ich', 'wissen')).toContain('wüsste')
    expect(cell('konjunktiv-2', 'er/sie/es', 'kommen')).toContain('käme')
  })

  it('Partizip II', () => {
    expect(cell('partizip-2', 'besuchen', 'Partizip II')).toContain('besucht')
    expect(cell('partizip-2', 'studieren', 'Partizip II')).toContain('studiert')
    expect(cell('partizip-2', 'anrufen', 'Partizip II')).toContain('angerufen')
  })
})

describe('word tables', () => {
  it('prepositions and their case', () => {
    const k = (p: string) => cell('prepositions-case', p, 'Kasus')
    expect(k('mit')).toContain('Dativ')
    expect(k('seit')).toContain('Dativ')
    expect(k('gegenüber')).toContain('Dativ')
    expect(k('für')).toContain('Akkusativ')
    expect(k('ohne')).toContain('Akkusativ')
    expect(k('bis')).toContain('Akkusativ')
    expect(k('auf')).toContain('Wechsel')
    expect(k('zwischen')).toContain('Wechsel')
    expect(k('wegen')).toContain('Genitiv')
    expect(k('trotz')).toContain('Genitiv')
  })

  it('irregular comparison', () => {
    expect(cell('comparison-irregular', 'gut', 'Komparativ')).toContain('besser')
    expect(cell('comparison-irregular', 'gut', 'Superlativ')).toContain('am besten')
    expect(cell('comparison-irregular', 'viel', 'Superlativ')).toContain('am meisten')
    expect(cell('comparison-irregular', 'gern', 'Komparativ')).toContain('lieber')
    expect(cell('comparison-irregular', 'hoch', 'Komparativ')).toContain('höher')
    expect(cell('comparison-irregular', 'nah', 'Superlativ')).toContain('am nächsten')
  })

  it('da- and wo-words', () => {
    expect(cell('da-wo-words', 'auf', 'da-')).toContain('darauf')
    expect(cell('da-wo-words', 'auf', 'wo-')).toContain('worauf')
    expect(cell('da-wo-words', 'mit', 'wo-')).toContain('womit')
    expect(cell('da-wo-words', 'über', 'da-')).toContain('darüber')
    expect(cell('da-wo-words', 'für', 'da-')).toContain('dafür')
  })
})

describe('verb data', () => {
  function verb(inf: string) {
    const v = VERB_BY_INF.get(inf)
    if (!v) throw new Error(`missing verb ${inf}`)
    return v
  }
  const er = (inf: string, t: Parameters<typeof conjugate>[1]) => conjugate(verb(inf), t)[2].split('/')

  it('has core irregular and modal verbs', () => {
    for (const inf of ['sein', 'haben', 'werden', 'wissen', 'tun', 'können', 'müssen', 'dürfen', 'sollen', 'wollen', 'mögen'])
      expect(VERB_BY_INF.has(inf), inf).toBe(true)
    expect(conjugate(verb('wissen'), 'present')[0]).toBe('weiß')
    expect(conjugate(verb('mögen'), 'present')[2]).toBe('mag')
  })

  it('forms principal parts correctly', () => {
    expect(er('gehen', 'perfekt')).toContain('ist gegangen')
    expect(er('bleiben', 'praeteritum')).toContain('blieb')
    expect(er('bleiben', 'perfekt')).toContain('ist geblieben')
    expect(er('bringen', 'perfekt')).toContain('hat gebracht')
    expect(er('denken', 'praeteritum')).toContain('dachte')
    expect(er('helfen', 'present')).toContain('hilft')
    expect(er('lesen', 'present')).toContain('liest')
    expect(er('schlafen', 'present')).toContain('schläft')
    expect(er('laufen', 'perfekt')).toContain('ist gelaufen')
    expect(er('werden', 'perfekt')).toContain('ist geworden')
    expect(er('essen', 'praeteritum')).toContain('aß')
    expect(er('vergessen', 'perfekt')).toContain('hat vergessen')
    expect(er('verstehen', 'perfekt')).toContain('hat verstanden')
    expect(er('ziehen', 'praeteritum')).toContain('zog')
    expect(er('treffen', 'present')).toContain('trifft')
    expect(er('anfangen', 'present')).toContain('fängt an')
    expect(er('anfangen', 'praeteritum')).toContain('fing an')
    expect(er('aufstehen', 'perfekt')).toContain('ist aufgestanden')
    expect(er('einladen', 'present')).toContain('lädt ein')
    expect(conjugate(verb('nehmen'), 'present')[1]).toBe('nimmst')
  })
})

describe('verb-preposition and gender tables', () => {
  it('covers B2 verbs with their preposition and case', () => {
    expect(table('verb-prepositions').rows.length).toBeGreaterThanOrEqual(80)
    expect(cell('verb-prepositions', 'beitragen', 'Präposition')).toEqual(['zu'])
    expect(cell('verb-prepositions', 'sich auswirken', 'Präposition')).toEqual(['auf'])
    expect(cell('verb-prepositions', 'sich auswirken', 'Kasus')).toEqual(['Akkusativ'])
    expect(cell('verb-prepositions', 'bestehen (= sich zusammensetzen)', 'Präposition')).toEqual(['aus'])
    expect(cell('verb-prepositions', 'bestehen (= fordern)', 'Kasus')).toEqual(['Dativ'])
    expect(cell('verb-prepositions', 'zweifeln', 'Kasus')).toEqual(['Dativ'])
  })

  it('does not teach -er as a masculine suffix in general', () => {
    expect(table('noun-suffix-gender').rows).not.toContain('-er')
    expect(table('noun-suffix-gender').tricks.join(' ')).toContain('das Fenster')
  })
})
