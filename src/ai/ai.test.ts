import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeCTest } from '../ctest/gapper'
import { BUILTIN_TEXTS } from '../ctest/texts'
import { extractJson, fetchModels } from './openrouter'
import { explainMistakes, generateExercises, generateText } from './tasks'

const cfg = { apiKey: 'k', model: 'm' }

function replies(...contents: string[]) {
  const fn = vi.fn()
  for (const c of contents)
    fn.mockResolvedValueOnce(new Response(JSON.stringify({ choices: [{ message: { content: c } }] })))
  vi.stubGlobal('fetch', fn)
  return fn
}

afterEach(() => vi.unstubAllGlobals())

describe('openrouter', () => {
  it('extracts JSON from fenced or chatty replies', () => {
    expect(extractJson('Sure!\n```json\n{"a":1}\n```')).toEqual({ a: 1 })
    expect(extractJson('here {"a":{"b":2}} done')).toEqual({ a: { b: 2 } })
    expect(() => extractJson('nothing')).toThrow()
  })

  it('lists models from the public endpoint', async () => {
    const fn = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ data: [{ id: 'b/x', name: 'B', pricing: { prompt: '0.000001' } }, { id: 'a/y' }] })),
    )
    vi.stubGlobal('fetch', fn)
    const models = await fetchModels()
    expect(fn).toHaveBeenCalledWith('https://openrouter.ai/api/v1/models')
    expect(models.map((m) => m.id)).toEqual(['a/y', 'b/x'])
    expect(models[1].promptPrice).toBeCloseTo(1)
  })
})

describe('generateText', () => {
  const good = BUILTIN_TEXTS[0]

  it('accepts a text that yields enough gaps', async () => {
    replies(JSON.stringify({ title: good.title, text: good.text, properNames: [] }))
    const t = await generateText(cfg, { level: 'B1', gaps: 20 })
    expect(makeCTest(t.text, { gaps: 20 }).gaps).toHaveLength(20)
  })

  it('retries when the text is too short or names are invented, then gives up', async () => {
    const short = 'Erster Satz ist hier. Zweiter Satz ist kurz und klein. Dritter Satz ist auch kurz. Vierter Satz kommt. Letzter Satz endet.'.repeat(2)
    const fn = replies(
      JSON.stringify({ title: 'Titel', text: short, properNames: [] }),
      JSON.stringify({ title: 'Titel', text: good.text, properNames: ['Hamburg'] }),
    )
    await expect(generateText(cfg, { level: 'B1', gaps: 20 })).rejects.toThrow(/properNames/)
    expect(fn).toHaveBeenCalledTimes(2)
    const second = JSON.parse(fn.mock.calls[1][1].body)
    expect(second.messages.at(-1).content).toMatch(/too short/)
  })
})

describe('explainMistakes', () => {
  const ct = makeCTest('Erster Satz. Wir müssen über Straßen gehen und dann warten. Ende.', { gaps: 3 })
  const [muessen, strassen, und] = ct.gaps
  const sentence = 'Wir müssen über Straßen gehen und dann warten.'
  const item = (n: number, accepted: boolean) => ({
    n,
    accepted,
    explanation: 'x explanation',
    rule: 'r',
    trick: '',
    topic: 'not-a-topic',
    strategy: 'spelling',
  })

  it('requires an item per gap and never accepts ascii umlauts or wrong lengths', async () => {
    const fn = replies(
      JSON.stringify({ items: [item(1, true)] }),
      JSON.stringify({ items: [item(1, true), item(2, true), item(3, true)] }),
    )
    const out = await explainMistakes(cfg, {
      text: ct.text,
      letterCount: true,
      wrong: [
        { n: 1, gap: muessen, given: 'ssen', sentence },
        { n: 2, gap: strassen, given: 'assen', sentence },
        { n: 3, gap: und, given: 'nd', sentence },
      ],
    })
    expect(fn).toHaveBeenCalledTimes(2)
    expect(out.map((o) => o.accepted)).toEqual([false, false, true])
    expect(out[0].topic).toBe('vocabulary')
    expect(out[0].strategy).toBe('spelling')
  })
})

describe('generateExercises', () => {
  it('rejects malformed exercises and stamps ids and topic', async () => {
    const fb = { rule: 'Dative after mit', cue: 'mit' }
    replies(
      JSON.stringify({ exercises: [{ kind: 'choice', prompt: 'mit ___ Bus', options: ['dem', 'den'], answer: 5, fb }] }),
      JSON.stringify({ exercises: [{ kind: 'gap', text: 'Ich fahre mit d{em} Bus.', fb }] }),
    )
    const ex = await generateExercises(cfg, { topic: 'prepositions', kinds: ['gap'], count: 1, level: 'A2' })
    expect(ex[0].topic).toBe('prepositions')
    expect(ex[0].id).toMatch(/^ai:prepositions:/)
  })
})
