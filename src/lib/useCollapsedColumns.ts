import { useCallback, useState } from 'react'
import type { PrStatus } from '../../server/types'

const STORAGE_KEY = 'pr-dashboard:collapsed-columns'

function loadCollapsed(): Set<PrStatus> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as PrStatus[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveCollapsed(statuses: Set<PrStatus>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...statuses]))
  } catch {
    // private browsing / quota exceeded — collapse state just won't persist
  }
}

/** Which Kanban columns are collapsed to a thin strip, persisted across reloads. */
export function useCollapsedColumns() {
  const [collapsed, setCollapsed] = useState<Set<PrStatus>>(() => loadCollapsed())

  const toggle = useCallback((status: PrStatus) => {
    setCollapsed((prev) => {
      const next = new Set(prev)
      if (next.has(status)) next.delete(status)
      else next.add(status)
      saveCollapsed(next)
      return next
    })
  }, [])

  return { collapsed, toggle }
}
