import type { ReactNode } from 'react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import type { Mastery } from '../practice/mastery'
import { setActivity } from './lookup'

export function Rich({ text }: { text: string }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') ? <strong key={i}>{p.slice(2, -2)}</strong> : <span key={i}>{p}</span>,
      )}
    </>
  )
}

export function Page({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">{title}</h1>
        {actions}
      </div>
      {children}
    </div>
  )
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`rounded-xl border border-stone-200 bg-white p-5 shadow-sm ${className}`}>{children}</div>
}

type BtnProps = {
  children: ReactNode
  onClick?: () => void
  kind?: 'primary' | 'plain' | 'ghost'
  disabled?: boolean
  type?: 'button' | 'submit'
  title?: string
}

export function Btn({ children, onClick, kind = 'plain', disabled, type = 'button', title }: BtnProps) {
  const style = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    plain: 'border border-stone-300 bg-white hover:bg-stone-100',
    ghost: 'text-stone-600 hover:bg-stone-100',
  }[kind]
  return (
    <button
      type={type}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium disabled:opacity-40 ${style}`}
    >
      {children}
    </button>
  )
}

export function LinkBtn({ to, children, primary }: { to: string; children: ReactNode; primary?: boolean }) {
  return (
    <Link
      to={to}
      className={`inline-block rounded-lg px-3 py-1.5 text-sm font-medium ${
        primary ? 'bg-indigo-600 text-white hover:bg-indigo-700' : 'border border-stone-300 bg-white hover:bg-stone-100'
      }`}
    >
      {children}
    </Link>
  )
}

export const STATUS_STYLE: Record<Mastery['status'] | 'known', string> = {
  new: 'bg-stone-100 border-stone-200 text-stone-600',
  weak: 'bg-rose-100 border-rose-300 text-rose-900',
  learning: 'bg-amber-100 border-amber-300 text-amber-900',
  strong: 'bg-emerald-100 border-emerald-300 text-emerald-900',
  known: 'bg-sky-100 border-sky-300 text-sky-900',
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className="rounded border border-stone-300 bg-stone-100 px-1 text-xs text-stone-600">{children}</kbd>
}

export function useActivity(label: string | null, locked = false) {
  useEffect(() => {
    setActivity(label, locked)
    return () => setActivity(null)
  }, [label, locked])
}

export function fmtTime(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}
