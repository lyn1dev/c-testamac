import { useEffect } from 'react'
import { Navigate, NavLink, Route, Routes, useLocation } from 'react-router-dom'
import { CramPage } from './pages/CramPage'
import { CTestPage } from './pages/CTestPage'
import { Dashboard } from './pages/Dashboard'
import { ExamPage } from './pages/ExamPage'
import { GrammarMap } from './pages/GrammarMap'
import { PlacementPage } from './pages/PlacementPage'
import { ReviewPage } from './pages/ReviewPage'
import { SessionPage } from './pages/SessionPage'
import { SettingsPage } from './pages/SettingsPage'
import { StrategiesPage } from './pages/StrategiesPage'
import { TablePage, TablesPage } from './pages/TablesPage'
import { TopicPage } from './pages/TopicPage'
import { VerbsPage } from './pages/VerbsPage'
import { useSettings } from './settings'
import { Kbd } from './ui/bits'
import { useDueCount } from './ui/hooks'
import { toggleReference } from './ui/lookup'
import { ReferencePanel } from './ui/ReferencePanel'
import { Umlauts } from './ui/Umlauts'

const NAV: [string, string][] = [
  ['/', 'Today'],
  ['/ctest', 'C-tests'],
  ['/grammar', 'Grammar'],
  ['/tables', 'Tables'],
  ['/verbs', 'Verbs'],
  ['/review', 'Review'],
  ['/exam', 'Exam'],
  ['/strategies', 'Strategies'],
  ['/settings', 'Settings'],
]

export function App() {
  const settings = useSettings()
  const due = useDueCount()
  const loc = useLocation()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        toggleReference()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  if (!settings) return null
  if (!settings.placementDone && loc.pathname !== '/placement' && loc.pathname !== '/settings')
    return <Navigate to="/placement" replace />

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-stone-200 bg-white/90 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-1 overflow-x-auto px-4 py-2 text-sm">
          <span className="mr-3 font-semibold text-indigo-700">C-Test Coach</span>
          {NAV.map(([to, label]) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `rounded-md px-2.5 py-1.5 whitespace-nowrap ${isActive ? 'bg-indigo-50 font-medium text-indigo-700' : 'text-stone-600 hover:bg-stone-100'}`
              }
            >
              {label}
              {to === '/review' && !!due && <span className="ml-1 rounded-full bg-rose-500 px-1.5 text-xs text-white">{due}</span>}
            </NavLink>
          ))}
          <button
            onClick={toggleReference}
            className="ml-auto rounded-md border border-stone-300 px-2 py-1 whitespace-nowrap text-stone-500 hover:bg-stone-50"
          >
            Look up <Kbd>Ctrl+K</Kbd>
          </button>
        </nav>
      </header>
      <main>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/placement" element={<PlacementPage />} />
          <Route path="/session" element={<SessionPage />} />
          <Route path="/ctest" element={<CTestPage />} />
          <Route path="/grammar" element={<GrammarMap />} />
          <Route path="/grammar/:id" element={<TopicPage />} />
          <Route path="/tables" element={<TablesPage />} />
          <Route path="/tables/:id" element={<TablePage />} />
          <Route path="/verbs" element={<VerbsPage />} />
          <Route path="/review" element={<ReviewPage />} />
          <Route path="/cram" element={<CramPage />} />
          <Route path="/exam" element={<ExamPage />} />
          <Route path="/strategies" element={<StrategiesPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <ReferencePanel />
      <Umlauts />
    </div>
  )
}
