import { useCallback, useState } from 'react'

const STORAGE_KEY = 'pr-dashboard:excluded-repos'

function loadExcluded(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveExcluded(repos: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...repos]))
  } catch {
    // private browsing / quota exceeded — filter just won't persist
  }
}

/** Which repos are toggled off in the repo filter, persisted across reloads. */
export function useExcludedRepos() {
  const [excluded, setExcluded] = useState<Set<string>>(() => loadExcluded())

  const toggle = useCallback((repo: string) => {
    setExcluded((prev) => {
      const next = new Set(prev)
      if (next.has(repo)) next.delete(repo)
      else next.add(repo)
      saveExcluded(next)
      return next
    })
  }, [])

  return { excluded, toggle }
}
