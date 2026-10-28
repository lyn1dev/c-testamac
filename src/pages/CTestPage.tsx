import { useMemo, useState } from 'react'
import { TOPIC_CATALOG } from '../content/catalog'
import { makeCTest, renderCTest } from '../ctest/gapper'
import { BUILTIN_TEXTS, type CTestLevel } from '../ctest/texts'
import type { CTestResult } from '../db'
import { aiReady, useSettings } from '../settings'
import { Btn, Card, Page } from '../ui/bits'
import { CTestPlayer, type PlayerText } from '../ui/ctest/Player'
import { CTestReview } from '../ui/ctest/Review'
import { functionWordDrill, nextText } from '../ui/ctest/source'
import { Drill } from '../ui/Drill'

type Tab = 'practice' | 'timed' | 'paste' | 'words'
type Phase = { kind: 'choose' } | { kind: 'play'; t: PlayerText } | { kind: 'review'; r: CTestResult }

const TABS: [Tab, string][] = [
  ['practice', 'Practice'],
  ['timed', 'Timed'],
  ['paste', 'Paste your own'],
  ['words', 'Function words'],
]

export function CTestPage() {
  const settings = useSettings()
  const [tab, setTab] = useState<Tab>('practice')
  const [phase, setPhase] = useState<Phase>({ kind: 'choose' })
  const [level, setLevel] = useState<CTestLevel | 'auto'>('auto')
  const [focus, setFocus] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [paste, setPaste] = useState({ title: '', text: '', names: '', level: 'B1' as CTestLevel })
  const [drillKey, setDrillKey] = useState(0)
  const words = useMemo(() => functionWordDrill(20), [drillKey])

  if (!settings) return null
  const timeLimit = tab === 'timed' ? settings.secondsPerText : undefined

  const start = async (useAi: boolean) => {
    setBusy(true)
    setError('')
    try {
      const t = await nextText({ level: level === 'auto' ? undefined : level, focus: focus || undefined, useAi })
      setPhase({ kind: 'play', t })
    } catch (e) {
      setError(`${e instanceof Error ? e.message : String(e)} — try again, pick another model, or use a built-in text.`)
    } finally {
      setBusy(false)
    }
  }

  const pastePreview = paste.text.trim()
    ? makeCTest(paste.text, { gaps: settings.gapCount, properNames: paste.names.split(',').map((s) => s.trim()).filter(Boolean) })
    : null

  if (phase.kind === 'play')
    return (
      <Page title="C-test" actions={<Btn kind="ghost" onClick={() => setPhase({ kind: 'choose' })}>Quit</Btn>}>
        <CTestPlayer
          key={phase.t.id + phase.t.text.length}
          t={phase.t}
          mode={tab === 'paste' ? 'paste' : tab === 'timed' ? 'timed' : 'practice'}
          gaps={settings.gapCount}
          letterCount={settings.letterCount}
          timeLimit={timeLimit}
          onFinished={(r) => setPhase({ kind: 'review', r })}
        />
      </Page>
    )

  if (phase.kind === 'review')
    return (
      <Page title="Your result">
        <CTestReview result={phase.r} onAgain={() => (tab === 'paste' ? setPhase({ kind: 'choose' }) : void start(true))} />
      </Page>
    )

  return (
    <Page title="C-test trainer">
      <div className="mb-4 flex gap-1 border-b border-stone-200">
        {TABS.map(([id, label]) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`px-3 py-2 text-sm ${tab === id ? 'border-b-2 border-indigo-600 font-semibold' : 'text-stone-500'}`}
          >
            {label}
          </button>
        ))}
      </div>

      {(tab === 'practice' || tab === 'timed') && (
        <div className="space-y-4">
          <Card>
            <div className="flex flex-wrap items-end gap-3">
              <label className="text-sm">
                Level
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value as CTestLevel | 'auto')}
                  className="mt-1 block rounded border border-stone-300 px-2 py-1"
                >
                  <option value="auto">Adaptive (from my scores)</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="B2+">B2+</option>
                </select>
              </label>
              {aiReady(settings) && (
                <label className="text-sm">
                  Grammar focus
                  <select
                    value={focus}
                    onChange={(e) => setFocus(e.target.value)}
                    className="mt-1 block max-w-64 rounded border border-stone-300 px-2 py-1"
                  >
                    <option value="">Mixed</option>
                    {TOPIC_CATALOG.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.level} · {t.title}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <Btn kind="primary" disabled={busy} onClick={() => void start(true)}>
                {busy ? 'Generating…' : aiReady(settings) ? 'New AI text' : 'Next text'}
              </Btn>
              {tab === 'timed' && (
                <span className="text-sm text-stone-500">{Math.round(settings.secondsPerText / 60)} min per text</span>
              )}
            </div>
            {error && <p className="mt-2 text-sm text-rose-700">{error}</p>}
            {!aiReady(settings) && (
              <p className="mt-2 text-sm text-stone-500">Built-in texts only. Add an OpenRouter key in Settings for unlimited adaptive texts.</p>
            )}
          </Card>
          <Card>
            <h2 className="mb-2 font-semibold">Built-in texts</h2>
            <ul className="divide-y divide-stone-100">
              {BUILTIN_TEXTS.map((t) => (
                <li key={t.id} className="flex items-center justify-between py-2 text-sm">
                  <span>
                    <span className="mr-2 rounded bg-stone-100 px-1.5 text-xs">{t.level}</span>
                    {t.title}
                  </span>
                  <Btn
                    kind="ghost"
                    onClick={() =>
                      setPhase({
                        kind: 'play',
                        t: { id: t.id, title: t.title, text: t.text, properNames: t.properNames ?? [], level: t.level },
                      })
                    }
                  >
                    Start
                  </Btn>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      )}

      {tab === 'paste' && (
        <Card>
          <div className="space-y-3">
            <textarea
              value={paste.text}
              onChange={(e) => setPaste({ ...paste, text: e.target.value })}
              rows={8}
              placeholder="Paste a German text (at least 6–7 sentences)…"
              className="w-full rounded-lg border border-stone-300 p-3"
            />
            <div className="flex flex-wrap gap-3">
              <input
                value={paste.title}
                onChange={(e) => setPaste({ ...paste, title: e.target.value })}
                placeholder="Title"
                className="rounded border border-stone-300 px-2 py-1"
              />
              <input
                value={paste.names}
                onChange={(e) => setPaste({ ...paste, names: e.target.value })}
                placeholder="Proper names to skip, comma-separated"
                className="min-w-72 flex-1 rounded border border-stone-300 px-2 py-1"
              />
              <select
                value={paste.level}
                onChange={(e) => setPaste({ ...paste, level: e.target.value as CTestLevel })}
                className="rounded border border-stone-300 px-2 py-1"
              >
                <option>B1</option>
                <option>B2</option>
                <option>B2+</option>
              </select>
            </div>
            {pastePreview && (
              <div className="rounded-lg bg-stone-50 p-3 text-sm leading-relaxed">
                <p className="mb-1 text-xs text-stone-500">
                  Preview: {pastePreview.gaps.length} of {settings.gapCount} gaps
                  {pastePreview.gaps.length < settings.gapCount && ' — text is too short for the full gap count'}
                </p>
                {renderCTest(pastePreview, { letterCount: settings.letterCount })}
              </div>
            )}
            <Btn
              kind="primary"
              disabled={!pastePreview || pastePreview.gaps.length === 0}
              onClick={() =>
                setPhase({
                  kind: 'play',
                  t: {
                    id: `paste-${Date.now().toString(36)}`,
                    title: paste.title || 'My text',
                    text: paste.text.trim(),
                    properNames: paste.names.split(',').map((s) => s.trim()).filter(Boolean),
                    level: paste.level,
                  },
                })
              }
            >
              Start
            </Btn>
          </div>
        </Card>
      )}

      {tab === 'words' && (
        <div className="space-y-3">
          <p className="text-sm text-stone-600">
            About half of all C-test gaps are short function words. These come straight from real sentences, gapped
            the C-test way. Aim for instant answers.
          </p>
          <Drill key={drillKey} items={words} source="practice" mode="rapid" />
          <Btn onClick={() => setDrillKey((k) => k + 1)}>New round</Btn>
        </div>
      )}
    </Page>
  )
}
