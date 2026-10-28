import { useState } from 'react'
import { TENSE_LABELS, TENSES, type Tense } from '../content/conjugate'
import { VERB_BY_INF, VERBS } from '../content/index'
import type { Item } from '../practice/items'
import { verbItems } from '../practice/pools'
import { Btn, Card, Page, Rich, useActivity } from '../ui/bits'
import { VerbView } from '../ui/ContentViews'
import { Drill } from '../ui/Drill'

const RULES = [
  '**Partizip II, weak:** ge- + stem + -t (gemacht, gearbeitet). **Strong:** ge- + (changed) stem + -en (gegangen, geschrieben). **Mixed:** vowel change + -t (gebracht, gedacht).',
  '**No ge-** with inseparable prefixes be-, emp-, ent-, er-, ge-, miss-, ver-, zer- (besucht, verstanden) and with -ieren verbs (studiert).',
  '**Separable verbs** put ge- between prefix and stem: angerufen, aufgestanden, eingekauft.',
  '**sein** in the Perfekt for movement from A to B (gehen, fahren, fliegen) and change of state (aufstehen, einschlafen, werden, sterben), plus sein, bleiben, passieren. Everything else, including all reflexive verbs and verbs with an accusative object, takes **haben**.',
  '**Präteritum:** weak verbs add -te- (machte); strong verbs change the vowel and have no ending in ich/er (ging, kam). Learn strong verbs by vowel pattern, not one by one.',
]

export function VerbsPage() {
  const groups = [...new Set(VERBS.map((v) => v.group).filter(Boolean))].sort() as string[]
  const [group, setGroup] = useState('')
  const [tenses, setTenses] = useState<Tense[]>(['present', 'praeteritum', 'perfekt'])
  const [timed, setTimed] = useState(false)
  const [items, setItems] = useState<Item[] | null>(null)
  const [round, setRound] = useState(0)
  const [lookup, setLookup] = useState('')
  const [drilling, setDrilling] = useState(false)
  useActivity(items ? 'verbs' : null)

  const start = () => {
    const kind = group === 'weak' || group === 'modal' ? group : undefined
    setItems(verbItems({ group: kind ? undefined : group || undefined, kind, tenses, count: timed ? 60 : 20 }))
    setRound((r) => r + 1)
    setDrilling(true)
  }
  const found = VERB_BY_INF.get(lookup.trim()) ?? VERBS.find((v) => v.inf.startsWith(lookup.trim()) && lookup.trim().length > 2)

  return (
    <Page title="Verb trainer">
      <div className="space-y-4">
        <Card>
          <div className="flex flex-wrap items-end gap-4">
            <label className="text-sm">
              Verbs
              <select value={group} onChange={(e) => setGroup(e.target.value)} className="mt-1 block rounded border border-stone-300 px-2 py-1">
                <option value="">All ~{VERBS.length}</option>
                <option value="weak">Weak only</option>
                <option value="modal">Modal verbs</option>
                {groups.map((g) => (
                  <option key={g} value={g}>
                    Pattern {g}
                  </option>
                ))}
              </select>
            </label>
            <fieldset className="text-sm">
              <legend>Tenses</legend>
              <div className="mt-1 flex flex-wrap gap-2">
                {TENSES.map((t) => (
                  <label key={t} className="flex items-center gap-1">
                    <input
                      type="checkbox"
                      checked={tenses.includes(t)}
                      onChange={(e) => setTenses((ts) => (e.target.checked ? [...ts, t] : ts.filter((x) => x !== t)))}
                    />
                    {TENSE_LABELS[t]}
                  </label>
                ))}
              </div>
            </fieldset>
            <label className="flex items-center gap-1 text-sm">
              <input type="checkbox" checked={timed} onChange={(e) => setTimed(e.target.checked)} /> Speed round (90 s)
            </label>
            <Btn kind="primary" onClick={start} disabled={tenses.length === 0}>
              Start
            </Btn>
          </div>
          <p className="mt-2 text-xs text-stone-500">Type the full form, e.g. "ist gegangen", "kam an", "würde machen". Alternatives are accepted.</p>
        </Card>
        {items && (
          <Drill
            key={round}
            items={items}
            source="practice"
            mode={timed ? 'rapid' : 'learn'}
            timeLimit={timed ? 90 : undefined}
            onDone={() => setDrilling(false)}
          />
        )}
        <Card>
          <h2 className="mb-2 font-semibold">Patterns, not lists</h2>
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {RULES.map((r) => (
              <li key={r}>
                <Rich text={r} />
              </li>
            ))}
          </ul>
        </Card>
        {drilling ? (
          <p className="text-sm text-stone-500">The verb lists and conjugation lookup are hidden while you drill.</p>
        ) : (
          <>
            <Card>
              <h2 className="mb-2 font-semibold">Strong verbs by vowel pattern</h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {groups.map((g) => (
                  <div key={g}>
                    <p className="font-mono text-sm font-semibold">{g}</p>
                    <p className="text-sm text-stone-700">
                      {VERBS.filter((v) => v.group === g)
                        .map((v) => `${v.inf} – ${v.praet}${v.sep ? ` ${v.sep}` : ''} – ${v.p2}`)
                        .join(' · ')}
                    </p>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <input
                value={lookup}
                onChange={(e) => setLookup(e.target.value)}
                placeholder="Show a verb's full conjugation (infinitive)…"
                className="mb-3 w-full rounded border border-stone-300 px-3 py-2"
              />
              {found && <VerbView verb={found} />}
            </Card>
          </>
        )}
      </div>
    </Page>
  )
}
