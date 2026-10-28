import { describe, expect, it } from 'vitest'
import { conjugate, PERSONS } from './conjugate'
import type { Verb } from './types'

const v = (x: Partial<Verb> & Pick<Verb, 'inf' | 'praet' | 'p2'>): Verb => ({
  en: '',
  kind: 'weak',
  aux: 'haben',
  ...x,
})

const machen = v({ inf: 'machen', praet: 'machte', p2: 'gemacht' })
const arbeiten = v({ inf: 'arbeiten', praet: 'arbeitete', p2: 'gearbeitet' })
const heissen = v({ inf: 'heißen', kind: 'strong', praet: 'hieß', p2: 'geheißen' })
const fahren = v({ inf: 'fahren', kind: 'strong', du: 'fährst', er: 'fährt', praet: 'fuhr', p2: 'gefahren', aux: 'both' })
const halten = v({ inf: 'halten', kind: 'strong', du: 'hältst', er: 'hält', praet: 'hielt', p2: 'gehalten' })
const ankommen = v({ inf: 'ankommen', kind: 'strong', sep: 'an', praet: 'kam', p2: 'angekommen', aux: 'sein', k2: 'käme' })
const sammeln = v({ inf: 'sammeln', praet: 'sammelte', p2: 'gesammelt' })
const oeffnen = v({ inf: 'öffnen', praet: 'öffnete', p2: 'geöffnet' })
const wohnen = v({ inf: 'wohnen', praet: 'wohnte', p2: 'gewohnt' })
const finden = v({ inf: 'finden', kind: 'strong', praet: 'fand', p2: 'gefunden' })
const sein = v({
  inf: 'sein',
  kind: 'irregular',
  present: ['bin', 'bist', 'ist', 'sind', 'seid', 'sind'],
  praet: 'war',
  p2: 'gewesen',
  aux: 'sein',
  k2: 'wäre',
})
const koennen = v({
  inf: 'können',
  kind: 'modal',
  present: ['kann', 'kannst', 'kann', 'können', 'könnt', 'können'],
  praet: 'konnte',
  p2: 'gekonnt',
  k2: 'könnte',
})

describe('conjugate', () => {
  it('has six persons', () => expect(PERSONS).toEqual(['ich', 'du', 'er/sie/es', 'wir', 'ihr', 'sie/Sie']))

  it('builds regular present forms with e-insertion and sibilant stems', () => {
    expect(conjugate(machen, 'present')).toEqual(['mache', 'machst', 'macht', 'machen', 'macht', 'machen'])
    expect(conjugate(arbeiten, 'present')).toEqual(['arbeite', 'arbeitest', 'arbeitet', 'arbeiten', 'arbeitet', 'arbeiten'])
    expect(conjugate(heissen, 'present')[1]).toBe('heißt')
    expect(conjugate(oeffnen, 'present').slice(1, 3)).toEqual(['öffnest', 'öffnet'])
    expect(conjugate(wohnen, 'present').slice(1, 3)).toEqual(['wohnst', 'wohnt'])
    expect(conjugate(sammeln, 'present')).toEqual(['sammle', 'sammelst', 'sammelt', 'sammeln', 'sammelt', 'sammeln'])
  })

  it('uses stored stem-change forms only for du and er', () => {
    expect(conjugate(fahren, 'present')).toEqual(['fahre', 'fährst', 'fährt', 'fahren', 'fahrt', 'fahren'])
    expect(conjugate(halten, 'present')).toEqual(['halte', 'hältst', 'hält', 'halten', 'haltet', 'halten'])
  })

  it('splits separable verbs', () => {
    expect(conjugate(ankommen, 'present')[2]).toBe('kommt an')
    expect(conjugate(ankommen, 'praeteritum')[3]).toBe('kamen an')
    expect(conjugate(ankommen, 'perfekt')[2]).toBe('ist angekommen')
  })

  it('builds Präteritum for weak and strong verbs', () => {
    expect(conjugate(machen, 'praeteritum')).toEqual(['machte', 'machtest', 'machte', 'machten', 'machtet', 'machten'])
    expect(conjugate(finden, 'praeteritum')).toEqual(['fand', 'fandest/fandst', 'fand', 'fanden', 'fandet', 'fanden'])
    expect(conjugate(sein, 'praeteritum')).toEqual(['war', 'warst', 'war', 'waren', 'wart', 'waren'])
    expect(conjugate(heissen, 'praeteritum')[1]).toBe('hießest/hießt')
  })

  it('builds compound tenses', () => {
    expect(conjugate(fahren, 'perfekt')[0]).toBe('bin gefahren/habe gefahren')
    expect(conjugate(machen, 'plusquamperfekt')[4]).toBe('hattet gemacht')
    expect(conjugate(machen, 'futur1')[1]).toBe('wirst machen')
    expect(conjugate(ankommen, 'futur1')[2]).toBe('wird ankommen')
  })

  it('builds Konjunktiv II and I', () => {
    expect(conjugate(sein, 'konjunktiv2')).toEqual(['wäre', 'wärest/wärst', 'wäre', 'wären', 'wäret/wärt', 'wären'])
    expect(conjugate(koennen, 'konjunktiv2')[2]).toBe('könnte')
    expect(conjugate(machen, 'konjunktiv2')[2]).toBe('würde machen')
    expect(conjugate(ankommen, 'konjunktiv2')[2]).toBe('käme an/würde ankommen')
    expect(conjugate(sein, 'konjunktiv1')).toEqual(['sei', 'seiest/seist', 'sei', 'seien', 'seiet', 'seien'])
    expect(conjugate(fahren, 'konjunktiv1')[2]).toBe('fahre')
    expect(conjugate(koennen, 'konjunktiv1')[2]).toBe('könne')
    expect(conjugate(ankommen, 'konjunktiv1')[2]).toBe('komme an')
  })
})
