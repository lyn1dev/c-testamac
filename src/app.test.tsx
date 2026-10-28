// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { StrictMode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { gapAnswers } from './content/exercise'
import { TABLE_BY_ID, TOPICS } from './content/index'
import { makeCTest } from './ctest/gapper'
import { BUILTIN_TEXTS } from './ctest/texts'
import { db } from './db'
import { DAY } from './practice/srs'
import { saveSetting } from './settings'

function openRouterMock() {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}'))
    const prompt: string = body.messages.at(-1).content
    let content: unknown
    if (prompt.includes('Correct it.')) {
      content = {
        correct: false,
        corrected: 'Gestern bin ich ins Kino gegangen.',
        errors: [{ wrong: 'habe', right: 'bin', rule: 'gehen takes sein' }],
        comment: '',
        usedTopic: true,
      }
    } else if (prompt.includes('follow-up question')) {
      content = { answer: 'Because mit always takes the dative.' }
    } else if (prompt.includes('Full text:')) {
      const ns = [...prompt.matchAll(/^(\d+)\. sentence:/gm)].map((m) => Number(m[1]))
      content = {
        items: ns.map((n) => ({
          n,
          accepted: false,
          explanation: `Explanation for gap ${n}`,
          rule: 'Dative after mit',
          trick: '',
          topic: 'prepositions',
          strategy: 'case-trigger',
        })),
      }
    } else {
      const t = BUILTIN_TEXTS[0]
      content = { title: 'Generierter Text', text: t.text, properNames: [] }
    }
    return new Response(JSON.stringify({ choices: [{ message: { content: JSON.stringify(content) } }] }))
  })
}

beforeEach(async () => {
  await db.delete()
  await db.open()
  vi.stubGlobal('fetch', openRouterMock())
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
})

const app = (path = '/') =>
  render(
    <StrictMode>
      <MemoryRouter initialEntries={[path]}>
        <App />
      </MemoryRouter>
    </StrictMode>,
  )

describe('first launch to explained mistakes', () => {
  it('runs placement, a session C-test with AI explanations, and opens a table from anywhere', async () => {
    await saveSetting('apiKey', 'sk-or-test')
    await saveSetting('model', 'test/model')
    app()

    fireEvent.click(await screen.findByRole('button', { name: 'Start' }))
    const drill = await screen.findByText(/1 \/ \d+/)
    const box = drill.closest('[tabindex="-1"]')!
    for (let i = 0; i < 16; i++) fireEvent.keyDown(box, { key: 'Escape' })

    const finish = await screen.findByRole('button', { name: /Finish/ })
    const gaps = screen.getAllByRole('textbox')
    fireEvent.change(gaps[0], { target: { value: 'xx' } })
    fireEvent.click(finish)

    fireEvent.click(await screen.findByRole('button', { name: "Start today's session" }))
    fireEvent.click(await screen.findByRole('button', { name: 'Begin' }))

    let ctestFinish = screen.queryByRole('button', { name: /Finish/ })
    while (!ctestFinish) {
      const skipBtn = await screen.findByRole('button', { name: /Skip this step|I know this — skip|Finish/ })
      if (/Finish/.test(skipBtn.textContent ?? '')) break
      fireEvent.click(skipBtn)
      ctestFinish = screen.queryByRole('button', { name: /Finish/ })
    }
    expect(await screen.findByText(/Generierter Text/)).toBeTruthy()
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))

    expect(await screen.findByText('Explanation for gap 1', {}, { timeout: 3000 })).toBeTruthy()
    const prompts = vi.mocked(fetch).mock.calls.map(([, init]) => String(init?.body))
    expect(prompts.filter((p) => p.includes('Write an original German text'))).toHaveLength(1)
    expect(prompts.filter((p) => p.includes('Full text:'))).toHaveLength(1)
    expect(screen.getAllByRole('button', { name: /Lesson: Prepositions/ }).length).toBeGreaterThan(0)
    const ask = (await screen.findAllByPlaceholderText(/Ask a follow-up/))[0]
    fireEvent.change(ask, { target: { value: 'Why dative?' } })
    fireEvent.keyDown(ask, { key: 'Enter' })
    expect(await screen.findByText('Because mit always takes the dative.')).toBeTruthy()
    const asked = (await db.results.toArray()).flatMap((r) => r.gaps.flatMap((g) => g.followUps ?? []))
    expect(asked).toEqual([{ q: 'Why dative?', a: 'Because mit always takes the dative.' }])
    const card = await db.cards.toArray()
    expect(card.some((c) => c.topic === 'prepositions')).toBe(true)

    fireEvent.keyDown(window, { key: 'k', ctrlKey: true })
    const search = await screen.findByPlaceholderText(/Search topics, tables/)
    fireEvent.change(search, { target: { value: 'Definite article' } })
    const panel = search.closest('aside')!
    fireEvent.click(within(panel).getAllByRole('button', { name: /Definite article/ })[0])
    await waitFor(() => expect(within(panel).getAllByText('dem').length).toBeGreaterThan(0))
  }, 20000)
})

describe('tables', () => {
  it('counts a perfect fill as a normal correct answer, not as known', async () => {
    await saveSetting('placementDone', true)
    app('/tables/def-article')
    fireEvent.click(await screen.findByRole('button', { name: 'Fill from memory' }))
    const answers = TABLE_BY_ID.get('def-article')!
      .cells.flat()
      .filter((c) => !['', '–'].includes(c.trim()))
      .map((c) => c.split('/')[0].trim())
    screen.getAllByRole('textbox').forEach((el, i) => fireEvent.change(el, { target: { value: answers[i] } }))
    fireEvent.click(screen.getByRole('button', { name: 'Check all' }))
    await waitFor(async () => expect(await db.attempts.count()).toBe(answers.length))
    await new Promise((r) => setTimeout(r, 300))
    const cards = await db.cards.toArray()
    expect(cards.length).toBeGreaterThan(0)
    for (const c of cards) expect(c.due - Date.now()).toBeLessThan(5 * DAY)
  })
})

describe('c-tests', () => {
  it('labels a text done before as a repeat and leaves it out of estimates', async () => {
    await saveSetting('placementDone', true)
    for (let round = 0; round < 2; round++) {
      cleanup()
      app('/ctest')
      fireEvent.click((await screen.findAllByRole('button', { name: 'Start' }))[0])
      fireEvent.click(await screen.findByRole('button', { name: /Finish/ }))
      await screen.findByText('Your result')
    }
    expect(screen.getByText(/repeat \(not counted in estimates\)/)).toBeTruthy()
    const results = await db.results.toArray()
    expect(results.map((r) => !!r.repeat)).toEqual([false, true])
  })

  it('tags correct gaps with a topic and counts them as correct grammar attempts', async () => {
    await saveSetting('placementDone', true)
    await saveSetting('apiKey', 'sk-or-test')
    await saveSetting('model', 'test/model')
    app('/ctest')
    fireEvent.click((await screen.findAllByRole('button', { name: 'Start' }))[0])
    await screen.findByRole('button', { name: /Finish/ })
    const t = BUILTIN_TEXTS[0]
    const ct = makeCTest(t.text, { gaps: 20, properNames: t.properNames })
    screen.getAllByRole('textbox').slice(0, ct.gaps.length).forEach((el, i) => fireEvent.change(el, { target: { value: ct.gaps[i].answer } }))
    fireEvent.click(screen.getByRole('button', { name: /Finish/ }))
    await waitFor(async () => expect(await db.attempts.where('topic').equals('prepositions').count()).toBe(20), { timeout: 3000 })
    const attempts = await db.attempts.toArray()
    expect(attempts.every((a) => a.correct)).toBe(true)
    expect((await db.results.toArray())[0].gaps.every((g) => g.topic === 'prepositions' && !g.explanation)).toBe(true)
  })

  it('removes a reported gap from scoring and from reviews', async () => {
    await saveSetting('placementDone', true)
    app('/ctest')
    fireEvent.click((await screen.findAllByRole('button', { name: 'Start' }))[0])
    fireEvent.click(await screen.findByRole('button', { name: /Finish/ }))
    await screen.findByText('Your result')
    await waitFor(async () => expect(await db.cards.count()).toBe(20))
    fireEvent.click(screen.getAllByRole('button', { name: 'Report this gap' })[0])
    await screen.findByText(/reported — not scored/)
    await waitFor(async () => expect(await db.cards.count()).toBe(19))
    const [r] = await db.results.toArray()
    expect([r.correct, r.total, r.gaps.length]).toEqual([0, 19, 20])
    expect(screen.getByText(/0 \/ 19/)).toBeTruthy()
  })
})

describe('writing', () => {
  it('turns each corrected writing error into a review card', async () => {
    await saveSetting('placementDone', true)
    await saveSetting('apiKey', 'sk-or-test')
    await saveSetting('model', 'test/model')
    app('/grammar/perfekt')
    fireEvent.click(await screen.findByRole('button', { name: /Write/ }))
    fireEvent.change(await screen.findByPlaceholderText('Schreib hier…'), { target: { value: 'Gestern habe ich ins Kino gegangen.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Correct my German' }))
    await screen.findByText(/gehen takes sein/)
    await waitFor(async () => expect(await db.cards.count()).toBe(1))
    const [card] = await db.cards.toArray()
    expect(card.item.kind === 'gap' && [card.item.before, card.item.gap.answer, card.topic]).toEqual(['Gestern ', 'bin', 'perfekt'])
  })

  it("puts a table speed round and, with a key, a writing task in today's session", async () => {
    await saveSetting('placementDone', true)
    app('/session')
    expect(await screen.findByText(/Table speed round/)).toBeTruthy()
    expect(screen.queryByText(/Writing:/)).toBeNull()
    cleanup()
    await saveSetting('apiKey', 'sk-or-test')
    await saveSetting('model', 'test/model')
    app('/session')
    expect(await screen.findByText(/Writing:/)).toBeTruthy()
  })
})

describe('umlauts', () => {
  it('types ä ö ü ß with Alt shortcuts and buttons into any answer field without losing focus', async () => {
    await saveSetting('placementDone', true)
    app('/tables/def-article')
    fireEvent.click(await screen.findByRole('button', { name: 'Fill from memory' }))
    const input = screen.getAllByRole('textbox')[0] as HTMLInputElement
    input.focus()
    fireEvent.change(input, { target: { value: 'x' } })
    input.setSelectionRange(0, 0)
    fireEvent.keyDown(input, { key: 'a', code: 'KeyA', altKey: true })
    fireEvent.keyDown(input, { key: 'O', code: 'KeyO', altKey: true, shiftKey: true })
    fireEvent.keyDown(input, { key: 's', code: 'KeyS', altKey: true })
    expect(input.value).toBe('äÖßx')
    fireEvent.keyDown(input, { key: 'u', code: 'KeyU', altKey: true, ctrlKey: true })
    expect(input.value).toBe('äÖßx')
    const ue = await screen.findByRole('button', { name: 'ü' })
    expect(fireEvent.mouseDown(ue)).toBe(false)
    fireEvent.click(ue)
    expect(input.value).toBe('äÖßüx')
    expect(document.activeElement).toBe(input)
  })

  it('works in the C-test player too', async () => {
    await saveSetting('placementDone', true)
    app('/ctest')
    fireEvent.click((await screen.findAllByRole('button', { name: 'Start' }))[0])
    await screen.findByRole('button', { name: /Finish/ })
    const gap = screen.getAllByRole('textbox')[0] as HTMLInputElement
    gap.focus()
    fireEvent.keyDown(gap, { key: 'u', code: 'KeyU', altKey: true })
    expect(gap.value).toBe('ü')
  })
})

describe('placement', () => {
  it('counts skipped questions as not known, so skipping cannot test a level out', async () => {
    app()
    fireEvent.click(await screen.findByRole('button', { name: 'Start' }))
    const box = (await screen.findByText(/1 \/ \d+/)).closest('[tabindex="-1"]')!
    const shown = TOPICS.filter((t) => t.level === 'A2')
      .flatMap((t) => t.exercises)
      .find((e) => (e.kind === 'choice' ? box.textContent!.includes(e.prompt) : e.kind === 'gap' && !!e.en && box.textContent!.includes(e.en)))!
    if (shown.kind === 'choice') fireEvent.keyDown(box, { key: String(shown.answer + 1) })
    else {
      within(box as HTMLElement)
        .getAllByRole('textbox')
        .forEach((el, i) => fireEvent.change(el, { target: { value: gapAnswers(shown.kind === 'gap' ? shown.text : '')[i][0] } }))
      fireEvent.keyDown(box, { key: 'Enter' })
    }
    await screen.findByText(/2 \/ \d+/)
    for (let i = 0; i < 15; i++) fireEvent.keyDown(box, { key: 'Escape' })
    fireEvent.click(await screen.findByRole('button', { name: /Finish/ }))
    expect(await screen.findByText(/A1–A2 grammar: 1\/16/)).toBeTruthy()
    expect(screen.queryByText(/tested out/)).toBeNull()
    expect((await db.topics.toArray()).some((t) => t.testedOutAt)).toBe(false)
  })
})
