import { generateText } from '../../ai/tasks'
import { fillGaps } from '../../content/exercise'
import { TOPICS } from '../../content/index'
import { functionWordGaps } from '../../ctest/functionWords'
import { splitSentences } from '../../ctest/gapper'
import { BUILTIN_TEXTS, type CTestLevel } from '../../ctest/texts'
import { db } from '../../db'
import { recommendedLevel } from '../../practice/estimate'
import { gapItem, type Item } from '../../practice/items'
import { shuffle } from '../../practice/pools'
import { aiReady, loadSettings } from '../../settings'
import type { PlayerText } from './Player'

export async function currentLevel(): Promise<CTestLevel> {
  return recommendedLevel(await db.results.toArray())
}

function builtinFor(level: CTestLevel, lastDone: Map<string, number>, exclude: string[] = []) {
  const want = level === 'B1' ? 'B1' : 'B2'
  return BUILTIN_TEXTS.filter((t) => t.level === want && !exclude.includes(t.id)).sort(
    (a, b) => (lastDone.get(a.id) ?? 0) - (lastDone.get(b.id) ?? 0),
  )[0]
}

export async function nextText(
  opts: { level?: CTestLevel; focus?: string; useAi?: boolean; exclude?: string[] } = {},
): Promise<PlayerText> {
  const level = opts.level ?? (await currentLevel())
  const settings = await loadSettings()
  if ((opts.useAi ?? true) && aiReady(settings)) {
    const recent = await db.aiTexts.orderBy('at').reverse().limit(15).toArray()
    const g = await generateText(settings, {
      level,
      gaps: settings.gapCount,
      focus: opts.focus,
      avoidTitles: recent.map((r) => r.title),
    })
    const id = `ai-${Date.now().toString(36)}`
    await db.aiTexts.put({ id, at: Date.now(), level, focus: opts.focus, ...g })
    return { id, level, title: g.title, text: g.text, properNames: g.properNames }
  }
  const done = await db.results.toArray()
  const lastDone = new Map(done.map((r) => [r.textId, r.at]))
  const t = builtinFor(level, lastDone, opts.exclude) ?? BUILTIN_TEXTS[0]
  return { id: t.id, level: t.level, title: t.title, text: t.text, properNames: t.properNames ?? [] }
}

let corpus: string[] | null = null

function sentences(): string[] {
  corpus ??= [
    ...TOPICS.flatMap((t) => t.examples.map((e) => e.de)),
    ...TOPICS.flatMap((t) => t.exercises.flatMap((e) => (e.kind === 'gap' ? [fillGaps(e.text)] : []))),
    ...BUILTIN_TEXTS.flatMap((t) => splitSentences(t.text)),
  ].filter((s) => s.length < 160)
  return corpus
}

export function functionWordDrill(count = 20): Item[] {
  const items: Item[] = []
  for (const s of shuffle(sentences())) {
    const options = functionWordGaps(s)
    if (options.length === 0) continue
    const { gap } = options[Math.floor(Math.random() * options.length)]
    items.push(gapItem(s, gap, undefined, 'function-words'))
    if (items.length >= count) break
  }
  return items
}
