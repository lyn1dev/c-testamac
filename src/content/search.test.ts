import { describe, expect, it } from 'vitest'
import { search } from './search'

describe('reference search', () => {
  it('finds a verb from any inflected form', () => {
    expect(search('ging')[0]).toMatchObject({ kind: 'verb', id: 'gehen' })
    expect(search('gefahren')[0]).toMatchObject({ kind: 'verb', id: 'fahren' })
    expect(search('nimmt')[0]).toMatchObject({ kind: 'verb', id: 'nehmen' })
  })

  it('finds tables by a form they contain and topics by title', () => {
    expect(search('dessen').some((h) => h.kind === 'table' && h.id === 'relative-pronouns')).toBe(true)
    expect(search('Konjunktiv II')[0]).toMatchObject({ kind: 'topic', id: 'konjunktiv-2' })
  })

  it('returns nothing for an empty query', () => {
    expect(search('  ')).toEqual([])
  })
})
