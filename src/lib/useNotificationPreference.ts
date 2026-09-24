import { useCallback, useState } from 'react'

const STORAGE_KEY = 'pr-dashboard:notifications'

function loadPreference(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'true'
  } catch {
    return false
  }
}

function currentPermission(): NotificationPermission {
  return typeof Notification === 'undefined' ? 'denied' : Notification.permission
}

/**
 * Desktop notifications need both the user's saved preference and the
 * browser's own permission grant. `enabled` is only true when both hold, so
 * callers never have to check permission separately.
 */
export function useNotificationPreference() {
  const [preferred, setPreferred] = useState<boolean>(() => loadPreference())
  const [permission, setPermission] = useState<NotificationPermission>(() => currentPermission())

  const toggle = useCallback(async () => {
    if (preferred) {
      setPreferred(false)
      try {
        localStorage.setItem(STORAGE_KEY, 'false')
      } catch {
        // private browsing / quota exceeded — preference just won't persist
      }
      return
    }

    if (typeof Notification === 'undefined') return
    let perm = Notification.permission
    if (perm === 'default') {
      perm = await Notification.requestPermission()
      setPermission(perm)
    }
    if (perm !== 'granted') return

    setPreferred(true)
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch {
      // private browsing / quota exceeded — preference just won't persist
    }
  }, [preferred])

  return { enabled: preferred && permission === 'granted', permission, toggle }
}
