import { useSyncExternalStore } from 'react'
import { db } from '../db'
import type { Hit } from '../content/search'

type State = { open: boolean; hit: Hit | null; lookups: number; activity: string | null; locked: boolean }

let state: State = { open: false, hit: null, lookups: 0, activity: null, locked: false }
const listeners = new Set<() => void>()

function set(patch: Partial<State>) {
  state = { ...state, ...patch }
  listeners.forEach((l) => l())
}

export function useLookup(): State {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l)
      return () => listeners.delete(l)
    },
    () => state,
  )
}

export function lookupCount(): number {
  return state.lookups
}

export function openReference(hit: Hit | null = null) {
  if (state.locked) {
    set({ open: true, hit: null })
    return
  }
  set({ open: true, hit })
  if (hit) noteLookup(hit)
}

export function noteLookup(hit: Hit) {
  set({ hit, lookups: state.activity ? state.lookups + 1 : state.lookups })
  void db.lookups.add({ at: Date.now(), target: `${hit.kind}:${hit.id}`, during: state.activity ?? undefined })
}

export function closeReference() {
  set({ open: false })
}

export function toggleReference() {
  if (state.open) closeReference()
  else openReference(null)
}

export function setActivity(activity: string | null, locked = false) {
  set({ activity, locked })
}
