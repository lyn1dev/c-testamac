import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { type Item } from '../practice/items'
import { dueItems } from '../practice/pools'
import { Btn, Kbd, Page, useActivity } from '../ui/bits'
import { Drill } from '../ui/Drill'
import { useDueCount } from '../ui/hooks'

export function ReviewPage() {
  const [params, setParams] = useSearchParams()
  const rapid = params.get('rapid') === '1'
  const due = useDueCount()
  const [items, setItems] = useState<Item[] | null>(null)
  const [round, setRound] = useState(0)
  useActivity('review')

  useEffect(() => {
    void dueItems(rapid ? 60 : 25).then(setItems)
  }, [round, rapid])

  return (
    <Page
      title={rapid ? 'Rapid review' : 'Review'}
      actions={
        <div className="flex items-center gap-2 text-sm">
          <span className="text-stone-500">{due ?? 0} due</span>
          <Btn onClick={() => setParams(rapid ? {} : { rapid: '1' })}>{rapid ? 'Normal mode' : 'Rapid mode'}</Btn>
        </div>
      }
    >
      <p className="mb-4 text-sm text-stone-600">
        Everything you learned or got wrong, in one queue, mixed. {rapid && 'Correct answers advance automatically. '}
        Keyboard only: <Kbd>Enter</Kbd> check/next · <Kbd>Esc</Kbd> skip · <Kbd>Alt+K</Kbd> I know this · <Kbd>1–4</Kbd> choices.
      </p>
      {items && items.length === 0 ? (
        <p className="text-stone-500">Nothing due. Come back later, or start a C-test.</p>
      ) : (
        items && (
          <>
            <Drill key={`${round}-${rapid}`} items={items} source="review" mode={rapid ? 'rapid' : 'learn'} />
            <div className="mt-3">
              <Btn onClick={() => setRound((r) => r + 1)}>Load more due items</Btn>
            </div>
          </>
        )
      )}
    </Page>
  )
}
