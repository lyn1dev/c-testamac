import { describe, expect, it } from 'vitest'
import { makeCTest, splitSentences } from './gapper'
import { BUILTIN_TEXTS } from './texts'

describe('built-in texts', () => {
  for (const t of BUILTIN_TEXTS) {
    it(`${t.id} yields 20 gaps between an intact first and last sentence`, () => {
      const ct = makeCTest(t.text, { properNames: t.properNames })
      expect(ct.gaps).toHaveLength(20)
      const last = ct.sentences.length - 1
      expect(ct.gaps.every((g) => g.sentence > 0 && g.sentence < last)).toBe(true)
      expect(splitSentences(t.text).length).toBeGreaterThanOrEqual(5)
    })
  }
})
