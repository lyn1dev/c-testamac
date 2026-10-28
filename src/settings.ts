import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

export type Settings = {
  apiKey: string
  model: string
  gapCount: number
  letterCount: boolean
  secondsPerText: number
  sessionMinutes: number
  examTexts: number
  placementDone: boolean
}

export const DEFAULT_SETTINGS: Settings = {
  apiKey: '',
  model: '',
  gapCount: 20,
  letterCount: true,
  secondsPerText: 300,
  sessionMinutes: 30,
  examTexts: 4,
  placementDone: false,
}

export async function loadSettings(): Promise<Settings> {
  const rows = await db.settings.toArray()
  return { ...DEFAULT_SETTINGS, ...Object.fromEntries(rows.map((r) => [r.key, r.value])) }
}

export async function saveSetting<K extends keyof Settings>(key: K, value: Settings[K]) {
  await db.settings.put({ key, value })
}

export function useSettings(): Settings | undefined {
  return useLiveQuery(loadSettings)
}

export function aiReady(s: Settings | undefined): s is Settings {
  return !!s && s.apiKey.trim() !== '' && s.model.trim() !== ''
}
