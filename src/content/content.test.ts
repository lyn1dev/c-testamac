import { describe, expect, it } from 'vitest'
import { TABLE_CATALOG, TOPIC_CATALOG } from './catalog'
import { gapAnswers } from './exercise'
import { TABLES, TOPICS, VERBS } from './index'

describe('topics', () => {
  it('cover the catalog exactly once, in order', () => {
    expect(TOPICS.map((t) => t.id)).toEqual(TOPIC_CATALOG.map((t) => t.id))
  })

  for (const entry of TOPIC_CATALOG) {
    it(`${entry.id} has a full lesson and exercises`, () => {
      const t = TOPICS.find((x) => x.id === entry.id)!
      expect(t, entry.id).toBeDefined()
      expect(t.level).toBe(entry.level)
      expect(t.rule.length).toBeGreaterThanOrEqual(2)
      expect(t.tricks.length).toBeGreaterThanOrEqual(2)
      expect(t.traps.length).toBeGreaterThanOrEqual(2)
      expect(t.examples.length).toBeGreaterThanOrEqual(4)
      expect(t.writing.length).toBeGreaterThanOrEqual(2)
      expect(t.inCTests.length).toBeGreaterThan(20)
      for (const id of t.tables) expect(TABLE_CATALOG.map((x) => x.id)).toContain(id)
      expect(t.exercises.length).toBeGreaterThanOrEqual(12)
      const kinds = new Set(t.exercises.map((e) => e.kind))
      expect(kinds.has('gap') && kinds.has('choice') && kinds.has('transform')).toBe(true)
      for (const e of t.exercises) {
        expect(e.topic, e.id).toBe(t.id)
        expect(e.id.startsWith(`${t.id}:`), e.id).toBe(true)
        expect(e.fb.rule.length, e.id).toBeGreaterThan(5)
        expect(e.fb.cue.length, e.id).toBeGreaterThan(2)
        if (e.kind === 'gap') {
          expect(gapAnswers(e.text).length, e.id).toBeGreaterThanOrEqual(1)
          expect(e.text.replace(/\{[^{}]+\}/g, ''), e.id).not.toMatch(/[{}|]/)
          for (const a of gapAnswers(e.text)) for (const alt of a) expect(alt.length, e.id).toBeGreaterThan(0)
        }
        if (e.kind === 'choice') {
          expect(e.options.length, e.id).toBeGreaterThanOrEqual(2)
          expect(new Set(e.options).size, e.id).toBe(e.options.length)
          expect(e.answer, e.id).toBeGreaterThanOrEqual(0)
          expect(e.answer, e.id).toBeLessThan(e.options.length)
        }
        if (e.kind === 'transform') {
          expect(e.answers.length, e.id).toBeGreaterThanOrEqual(1)
          expect(e.source.length, e.id).toBeGreaterThan(3)
        }
      }
    })
  }

  it('have unique exercise ids', () => {
    const ids = TOPICS.flatMap((t) => t.exercises.map((e) => e.id))
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('tables', () => {
  it('cover the catalog', () => {
    expect(TABLES.map((t) => t.id).sort()).toEqual(TABLE_CATALOG.map((t) => t.id).sort())
  })

  for (const t of TABLES) {
    it(`${t.id} is rectangular and linked`, () => {
      expect(t.cells.length).toBe(t.rows.length)
      for (const row of t.cells) expect(row.length).toBe(t.cols.length)
      expect(t.pattern.length).toBeGreaterThan(20)
      for (const id of t.topics) expect(TOPIC_CATALOG.map((x) => x.id)).toContain(id)
      for (const [r, c] of t.highlight ?? []) expect(t.cells[r]?.[c]).toBeDefined()
    })
  }
})

describe('verbs', () => {
  it('has about 200 unique verbs', () => {
    expect(VERBS.length).toBeGreaterThanOrEqual(190)
    expect(new Set(VERBS.map((v) => v.inf)).size).toBe(VERBS.length)
  })

  it('is internally consistent', () => {
    for (const v of VERBS) {
      if (v.sep) {
        expect(v.inf.startsWith(v.sep), v.inf).toBe(true)
        expect(v.p2.startsWith(v.sep), v.inf).toBe(true)
        expect(v.praet.startsWith(v.sep), v.inf).toBe(false)
      }
      if (v.kind === 'strong' || v.kind === 'mixed') expect(v.group, v.inf).toBeTruthy()
      if (v.present) expect(v.present.length, v.inf).toBe(6)
      expect(v.en.length, v.inf).toBeGreaterThan(1)
    }
  })
})
