import { useCallback, useState } from 'react'

const STORAGE_KEY = 'pr-dashboard:dismissed-comments'

function loadDismissed(): Set<string> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

function saveDismissed(ids: Set<string>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]))
  } catch {
    // private browsing / quota exceeded — dismissals just won't persist
  }
}

/**
 * Lets you mark an unaddressed comment/thread as "seen" without replying to
 * it on GitHub (there's no such concept there for plain PR comments). Stored
 * locally per-browser, keyed by the comment's GitHub URL.
 */
export function useDismissedComments() {
  const [dismissed, setDismissed] = useState<Set<string>>(() => loadDismissed())

  const dismiss = useCallback((url: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.add(url)
      saveDismissed(next)
      return next
    })
  }, [])

  const undismiss = useCallback((url: string) => {
    setDismissed((prev) => {
      const next = new Set(prev)
      next.delete(url)
      saveDismissed(next)
      return next
    })
  }, [])

  const isDismissed = useCallback((url: string) => dismissed.has(url), [dismissed])

  // Drop dismissed ids that no longer correspond to a live unaddressed item
  // (the thread got resolved/replied to, or the comment scrolled out of the
  // fetch window) so storage doesn't grow forever.
  const prune = useCallback((validIds: Set<string>) => {
    setDismissed((prev) => {
      let changed = false
      const next = new Set<string>()
      for (const id of prev) {
        if (validIds.has(id)) next.add(id)
        else changed = true
      }
      if (!changed) return prev
      saveDismissed(next)
      return next
    })
  }, [])

  return { dismiss, undismiss, isDismissed, prune }
}
