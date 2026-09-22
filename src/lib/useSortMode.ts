import { useCallback, useState } from 'react'
import type { SortMode } from './sortPrs'

const STORAGE_KEY = 'pr-dashboard:sort-mode'

function loadSortMode(): SortMode {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'staleness' ? 'staleness' : 'updated'
  } catch {
    return 'updated'
  }
}

export function useSortMode() {
  const [mode, setModeState] = useState<SortMode>(() => loadSortMode())

  const setMode = useCallback((next: SortMode) => {
    setModeState(next)
    try {
      localStorage.setItem(STORAGE_KEY, next)
    } catch {
      // private browsing / quota exceeded — sort choice just won't persist
    }
  }, [])

  return { mode, setMode }
}
