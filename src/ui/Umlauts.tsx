import { useEffect, useState } from 'react'

const KEYS: Record<string, [string, string]> = {
  KeyA: ['ä', 'Ä'],
  KeyO: ['ö', 'Ö'],
  KeyU: ['ü', 'Ü'],
  KeyS: ['ß', 'ß'],
}

type Field = HTMLInputElement | HTMLTextAreaElement

function textField(el: Element | null): Field | null {
  if (el instanceof HTMLTextAreaElement) return el
  if (el instanceof HTMLInputElement && ['text', 'search', ''].includes(el.type)) return el
  return null
}

function insert(el: Field, text: string) {
  const start = el.selectionStart ?? el.value.length
  const end = el.selectionEnd ?? start
  const proto = el instanceof HTMLTextAreaElement ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype
  Object.getOwnPropertyDescriptor(proto, 'value')!.set!.call(el, el.value.slice(0, start) + text + el.value.slice(end))
  el.setSelectionRange(start + text.length, start + text.length)
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

export function Umlauts() {
  const [field, setField] = useState<Field | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = textField(e.target as Element)
      const chars = KEYS[e.code]
      if (!el || !chars || !e.altKey || e.ctrlKey || e.metaKey || el.disabled || el.readOnly) return
      e.preventDefault()
      insert(el, chars[e.shiftKey ? 1 : 0])
    }
    const onFocus = () => setField(textField(document.activeElement))
    window.addEventListener('keydown', onKey, true)
    document.addEventListener('focusin', onFocus)
    document.addEventListener('focusout', onFocus)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.removeEventListener('focusin', onFocus)
      document.removeEventListener('focusout', onFocus)
    }
  }, [])

  if (!field || field.disabled) return null
  return (
    <div className="fixed right-4 bottom-4 z-40 flex items-center gap-1 rounded-lg border border-stone-200 bg-white p-1.5 shadow-lg">
      {['ä', 'ö', 'ü', 'ß', 'Ä', 'Ö', 'Ü'].map((ch) => (
        <button
          key={ch}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => insert(field, ch)}
          className="h-8 w-8 rounded border border-stone-300 font-mono text-lg hover:bg-indigo-50"
        >
          {ch}
        </button>
      ))}
      <span className="px-1 text-xs text-stone-500">Alt+A/O/U/S · Shift = capital</span>
    </div>
  )
}
