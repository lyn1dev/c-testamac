// @vitest-environment jsdom
import 'fake-indexeddb/auto'
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { App } from './App'
import { TABLE_BY_ID } from './content/index'
import { BUILTIN_TEXTS } from './ctest/texts'
import { db } from './db'
import { DAY } from './practice/srs'
import { saveSetting } from './settings'

function openRouterMock() {
  return vi.fn(async (_url: string, init?: RequestInit) => {
    const body = JSON.parse(String(init?.body ?? '{}'))
    const prompt: string = body.messages.at(-1).content
    let content: unknown
    if (prompt.includes('graded wrong')) {
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
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
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
    expect(screen.getAllByRole('button', { name: /Lesson: Prepositions/ }).length).toBeGreaterThan(0)
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
