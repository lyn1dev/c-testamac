import { afterEach, describe, expect, it, vi } from 'vitest'
import { makeCTest } from '../ctest/gapper'
import { BUILTIN_TEXTS } from '../ctest/texts'
import { extractJson, fetchModels } from './openrouter'
import { explainGaps, generateExercises, generateText } from './tasks'

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
    replies(
      JSON.stringify({ title: good.title, text: good.text, properNames: [] }),
      JSON.stringify({ text: good.text, corrections: [] }),
    )
    const t = await generateText(cfg, { level: 'B1', gaps: 20 })
    expect(makeCTest(t.text, { gaps: 20 }).gaps).toHaveLength(20)
  })

  it('asks to avoid the most recent titles, which come newest first', async () => {
    const fn = replies(
      JSON.stringify({ title: good.title, text: good.text, properNames: [] }),
      JSON.stringify({ text: good.text, corrections: [] }),
    )
    const titles = Array.from({ length: 15 }, (_, i) => `Titel ${i}`)
    await generateText(cfg, { level: 'B1', gaps: 20, avoidTitles: titles })
    const prompt = String(fn.mock.calls[0][1].body)
    expect(prompt).toContain('Titel 0;')
    expect(prompt).not.toContain('Titel 14')
  })

  it('proofreads the text before gapping and re-checks the corrected version', async () => {
    const draft = good.text.replace('eine günstige Wohnung', 'einen günstige Wohnung')
    const fn = replies(
      JSON.stringify({ title: good.title, text: draft, properNames: [] }),
      JSON.stringify({ text: 'Zu kurz. Viel zu kurz.', corrections: [] }),
      JSON.stringify({ text: good.text, corrections: [{ wrong: 'einen günstige', right: 'eine günstige' }] }),
    )
    const t = await generateText(cfg, { level: 'B1', gaps: 20 })
    expect(fn).toHaveBeenCalledTimes(3)
    expect(String(fn.mock.calls[1][1].body)).toContain('einen günstige Wohnung')
    expect(t.text).toBe(good.text)
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

describe('explainGaps', () => {
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
    const out = await explainGaps(cfg, {
      text: ct.text,
      letterCount: true,
      gaps: [
        { n: 1, gap: muessen, given: 'ssen', sentence, correct: false },
        { n: 2, gap: strassen, given: 'assen', sentence, correct: false },
        { n: 3, gap: und, given: 'nd', sentence, correct: false },
      ],
    })
    expect(fn).toHaveBeenCalledTimes(2)
    expect(out.map((o) => o.accepted)).toEqual([false, false, true])
    expect(out[0].topic).toBe('vocabulary')
    expect(out[0].strategy).toBe('spelling')
  })

  it('tags correct gaps with a topic and insists on explanations for wrong ones', async () => {
    const fn = replies(
      JSON.stringify({ items: [{ n: 1, topic: 'modal-verbs' }, { n: 2, topic: 'plurals' }] }),
      JSON.stringify({ items: [item(1, false), { n: 2, topic: 'plurals' }] }),
    )
    const out = await explainGaps(cfg, {
      text: ct.text,
      letterCount: true,
      gaps: [
        { n: 1, gap: muessen, given: 'xx', sentence, correct: false },
        { n: 2, gap: strassen, given: 'aßen', sentence, correct: true },
      ],
    })
    expect(fn).toHaveBeenCalledTimes(2)
    expect(String(fn.mock.calls[0][1].body)).toContain('answered correctly')
    expect(out.find((o) => o.n === 2)).toMatchObject({ topic: 'plurals', accepted: false, explanation: '' })
    expect(out.find((o) => o.n === 1)?.explanation).toBe('x explanation')
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
