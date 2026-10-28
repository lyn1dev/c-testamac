import { useState } from 'react'
import { fetchModels, type ModelInfo } from '../ai/openrouter'
import { db } from '../db'
import { saveSetting, useSettings, type Settings } from '../settings'
import { Btn, Card, Page } from '../ui/bits'

function NumberField({ label, k, value, min, max, step = 1 }: { label: string; k: keyof Settings; value: number; min: number; max: number; step?: number }) {
  const [draft, setDraft] = useState<string | null>(null)
  return (
    <label className="block text-sm">
      {label}
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={draft ?? value}
        onChange={(e) => {
          setDraft(e.target.value)
          const n = Number(e.target.value)
          if (e.target.value !== '' && n >= min && n <= max) void saveSetting(k, n as never)
        }}
        onBlur={() => setDraft(null)}
        className="mt-1 block w-28 rounded border border-stone-300 px-2 py-1"
      />
    </label>
  )
}

export function SettingsPage() {
  const s = useSettings()
  const [models, setModels] = useState<ModelInfo[] | null>(null)
  const [filter, setFilter] = useState('')
  const [error, setError] = useState('')
  const [confirm, setConfirm] = useState(false)
  if (!s) return null

  const load = async () => {
    setError('')
    try {
      setModels(await fetchModels())
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    }
  }
  const shown = (models ?? []).filter((m) => `${m.id} ${m.name}`.toLowerCase().includes(filter.toLowerCase())).slice(0, 200)

  return (
    <Page title="Settings">
      <div className="space-y-4">
        <Card>
          <h2 className="mb-3 font-semibold">AI (OpenRouter)</h2>
          <p className="mb-3 text-sm text-stone-600">
            Used for generated texts and exercises, mistake explanations and writing correction. Calls go straight from this
            browser to openrouter.ai; the key is stored only in this browser's IndexedDB. Everything else works offline.
          </p>
          <label className="block text-sm">
            API key
            <input
              type="password"
              value={s.apiKey}
              onChange={(e) => void saveSetting('apiKey', e.target.value.trim())}
              placeholder="sk-or-…"
              className="mt-1 block w-full rounded border border-stone-300 px-2 py-1 font-mono"
              autoComplete="off"
            />
          </label>
          <div className="mt-3 text-sm">
            Model: <span className="font-mono">{s.model || 'none selected'}</span>
            <div className="mt-2 flex gap-2">
              <Btn onClick={() => void load()}>{models ? 'Reload models' : 'Load model list'}</Btn>
              {models && (
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder={`Filter ${models.length} models…`}
                  className="flex-1 rounded border border-stone-300 px-2 py-1"
                />
              )}
            </div>
            {error && <p className="mt-2 text-rose-700">{error}</p>}
            {models && (
              <ul className="mt-2 max-h-72 overflow-y-auto rounded border border-stone-200">
                {shown.map((m) => (
                  <li key={m.id}>
                    <button
                      onClick={() => void saveSetting('model', m.id)}
                      className={`flex w-full justify-between px-2 py-1 text-left hover:bg-stone-50 ${m.id === s.model ? 'bg-indigo-50' : ''}`}
                    >
                      <span>
                        {m.name} <span className="font-mono text-xs text-stone-400">{m.id}</span>
                      </span>
                      <span className="text-xs text-stone-500">${m.promptPrice.toFixed(2)}/M in</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">C-test format</h2>
          <div className="flex flex-wrap gap-6">
            <NumberField label="Gaps per text" k="gapCount" value={s.gapCount} min={5} max={40} />
            <NumberField label="Seconds per text (timed / exam)" k="secondsPerText" value={s.secondsPerText} min={60} max={1800} step={30} />
            <NumberField label="Texts per exam" k="examTexts" value={s.examTexts} min={1} max={8} />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={s.letterCount} onChange={(e) => void saveSetting('letterCount', e.target.checked)} />
              Show the number of missing letters
            </label>
          </div>
        </Card>
        <Card>
          <h2 className="mb-3 font-semibold">Data</h2>
          <div className="flex flex-wrap gap-2">
            <Btn
              onClick={async () => {
                const dump = Object.fromEntries(await Promise.all(db.tables.map(async (t) => [t.name, await t.toArray()])))
                const a = document.createElement('a')
                a.href = URL.createObjectURL(new Blob([JSON.stringify(dump)], { type: 'application/json' }))
                a.download = `ctest-coach-${new Date().toISOString().slice(0, 10)}.json`
                a.click()
              }}
            >
              Export progress
            </Btn>
            {!confirm ? (
              <Btn kind="ghost" onClick={() => setConfirm(true)}>
                Reset all progress…
              </Btn>
            ) : (
              <Btn
                onClick={async () => {
                  await Promise.all(db.tables.filter((t) => t.name !== 'settings').map((t) => t.clear()))
                  await saveSetting('placementDone', false)
                  setConfirm(false)
                }}
              >
                Really delete progress (keeps settings)
              </Btn>
            )}
          </div>
        </Card>
      </div>
    </Page>
  )
}
