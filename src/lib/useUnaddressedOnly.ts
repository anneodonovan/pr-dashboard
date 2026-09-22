import { useCallback, useState } from 'react'

const STORAGE_KEY = 'pr-dashboard:unaddressed-only'

function loadUnaddressedOnly(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

export function useUnaddressedOnly() {
  const [enabled, setEnabledState] = useState<boolean>(() => loadUnaddressedOnly())

  const toggle = useCallback(() => {
    setEnabledState((prev) => {
      const next = !prev
      try {
        localStorage.setItem(STORAGE_KEY, String(next))
      } catch {
        // private browsing / quota exceeded — filter just won't persist
      }
      return next
    })
  }, [])

  return { enabled, toggle }
}
