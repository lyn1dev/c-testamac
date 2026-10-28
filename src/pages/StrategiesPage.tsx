import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { STRATEGIES } from '../content/strategies'
import { Card, Page } from '../ui/bits'

export function StrategiesPage() {
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) document.getElementById(hash.slice(1))?.scrollIntoView({ block: 'center' })
  }, [hash])
  return (
    <Page title="C-test strategies">
      <p className="mb-4 text-sm text-stone-600">
        A C-test deletes the second half of every second word from the second sentence on. Each mistake explanation names
        the strategy below that would have caught it.
      </p>
      <div className="space-y-3">
        {STRATEGIES.map((s, i) => (
          <Card key={s.id} className={hash === `#${s.id}` ? 'ring-2 ring-indigo-400' : ''}>
            <h2 id={s.id} className="font-semibold">
              {i + 1}. {s.title}
            </h2>
            <p className="mt-1 text-sm">{s.text}</p>
            {s.example && <p className="mt-2 font-mono text-sm text-stone-600">{s.example}</p>}
          </Card>
        ))}
      </div>
    </Page>
  )
}
