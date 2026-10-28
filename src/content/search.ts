import { allForms } from './conjugate'
import { TABLES, TOPICS, VERBS } from './index'
import { STRATEGIES } from './strategies'

export type Hit =
  | { kind: 'topic'; id: string; title: string; detail: string }
  | { kind: 'table'; id: string; title: string; detail: string }
  | { kind: 'verb'; id: string; title: string; detail: string }
  | { kind: 'trick'; id: string; title: string; detail: string }
  | { kind: 'strategy'; id: string; title: string; detail: string }

type Entry = { hit: Hit; exact: string[]; text: string }

const fold = (s: string) => s.normalize('NFC').toLowerCase().trim()

let index: Entry[] | null = null

function build(): Entry[] {
  const entries: Entry[] = []
  for (const t of TOPICS) {
    entries.push({
      hit: { kind: 'topic', id: t.id, title: t.title, detail: t.summary },
      exact: [fold(t.title), t.id],
      text: fold([t.title, t.summary, ...t.rule].join(' ')),
    })
    for (const trick of [...t.tricks, ...t.traps]) {
      entries.push({ hit: { kind: 'trick', id: t.id, title: trick, detail: t.title }, exact: [], text: fold(trick) })
    }
  }
  for (const t of TABLES) {
    const forms = t.cells.flat().flatMap((c) => c.split('/').map(fold))
    entries.push({
      hit: { kind: 'table', id: t.id, title: t.title, detail: t.pattern },
      exact: [fold(t.title), ...t.rows.map(fold), ...forms.filter((f) => f.length > 2)],
      text: fold([t.title, t.pattern, ...t.rows, ...t.cols].join(' ')),
    })
  }
  for (const v of VERBS) {
    entries.push({
      hit: { kind: 'verb', id: v.inf, title: v.inf, detail: `${v.en} · ${v.praet} · ${v.p2}` },
      exact: allForms(v).map(fold),
      text: fold(`${v.inf} ${v.en}`),
    })
  }
  for (const s of STRATEGIES) {
    entries.push({ hit: { kind: 'strategy', id: s.id, title: s.title, detail: s.text }, exact: [], text: fold(`${s.title} ${s.text}`) })
  }
  return entries
}

export function search(query: string, limit = 30): Hit[] {
  const q = fold(query)
  if (q.length === 0) return []
  index ??= build()
  const scored: [number, Hit][] = []
  for (const e of index) {
    let score = 0
    if (e.exact.includes(q)) score = e.hit.kind === 'verb' ? 100 : 90
    else if (fold(e.hit.title).startsWith(q)) score = 60
    else if (fold(e.hit.title).includes(q)) score = 40
    else if (e.text.includes(q)) score = 20
    if (score > 0) scored.push([score, e.hit])
  }
  return scored.sort((a, b) => b[0] - a[0]).slice(0, limit).map(([, h]) => h)
}
