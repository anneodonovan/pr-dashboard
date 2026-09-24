import { useCallback, useEffect, useRef, useState } from 'react'
import type { DashboardData, Pr } from '../../server/types'

export type NotificationKind = 'comment' | 'approved' | 'conflicts'

export interface NotificationEntry {
  id: string
  kind: NotificationKind
  repo: string
  number: number
  title: string
  detail: string
  url: string
  at: string
}

interface PrSnapshot {
  approved: boolean
  conflicts: boolean
  unaddressedUrls: Set<string>
}

const LOG_KEY = 'pr-dashboard:notification-log'
const SEEN_KEY = 'pr-dashboard:notification-log-seen'
const MAX_LOG_ENTRIES = 50

function prKey(pr: Pr): string {
  return `${pr.repo}#${pr.number}`
}

function snapshot(pr: Pr): PrSnapshot {
  return {
    approved: pr.status === 'approved' || pr.status === 'ready-to-merge',
    conflicts: pr.staleness === 'conflicts',
    unaddressedUrls: new Set(pr.unaddressedThreads.map((t) => t.url)),
  }
}

function loadLog(): NotificationEntry[] {
  try {
    const raw = localStorage.getItem(LOG_KEY)
    return raw ? (JSON.parse(raw) as NotificationEntry[]) : []
  } catch {
    return []
  }
}

function loadSeenAt(): string {
  try {
    return localStorage.getItem(SEEN_KEY) ?? ''
  } catch {
    return ''
  }
}

function fireDesktopNotification(entry: NotificationEntry) {
  const n = new Notification(entry.title, { body: entry.detail, tag: entry.id })
  n.onclick = () => {
    window.focus()
    window.open(entry.url, '_blank')
    n.close()
  }
}

/**
 * Detects PR events worth surfacing — a new unaddressed comment, a PR
 * becoming approved, or conflicts appearing — by diffing each poll against
 * the previous one. Always keeps an in-app log (persisted, capped at 50
 * entries) as the reliable record, since OS-level notification settings can
 * silently suppress the native popup (sound but no banner) even once
 * permission is granted; a native desktop Notification is additionally
 * fired when `desktopEnabled`.
 */
export function usePrNotifications(data: DashboardData | null, desktopEnabled: boolean) {
  const prevByKey = useRef<Map<string, PrSnapshot> | null>(null)
  const [entries, setEntries] = useState<NotificationEntry[]>(() => loadLog())
  const [seenAt, setSeenAt] = useState<string>(() => loadSeenAt())

  useEffect(() => {
    if (!data) return

    const nextByKey = new Map(data.prs.map((pr) => [prKey(pr), snapshot(pr)]))

    if (prevByKey.current) {
      const prev = prevByKey.current
      const now = new Date().toISOString()
      const newEntries: NotificationEntry[] = []

      for (const pr of data.prs) {
        const before = prev.get(prKey(pr))
        if (!before) continue
        const after = nextByKey.get(prKey(pr))!

        for (const thread of pr.unaddressedThreads) {
          if (before.unaddressedUrls.has(thread.url)) continue
          newEntries.push({
            id: thread.url,
            kind: 'comment',
            repo: pr.repo,
            number: pr.number,
            title: `New comment on #${pr.number}`,
            detail: `${thread.author} on "${pr.title}"`,
            url: thread.url,
            at: now,
          })
        }

        if (after.approved && !before.approved) {
          newEntries.push({
            id: `${prKey(pr)}-approved-${Date.now()}`,
            kind: 'approved',
            repo: pr.repo,
            number: pr.number,
            title: `Approved: #${pr.number}`,
            detail: pr.title,
            url: pr.url,
            at: now,
          })
        }

        if (after.conflicts && !before.conflicts) {
          newEntries.push({
            id: `${prKey(pr)}-conflicts-${Date.now()}`,
            kind: 'conflicts',
            repo: pr.repo,
            number: pr.number,
            title: `Conflicts: #${pr.number}`,
            detail: pr.title,
            url: pr.url,
            at: now,
          })
        }
      }

      if (newEntries.length > 0) {
        setEntries((prevEntries) => {
          const next = [...newEntries, ...prevEntries].slice(0, MAX_LOG_ENTRIES)
          try {
            localStorage.setItem(LOG_KEY, JSON.stringify(next))
          } catch {
            // private browsing / quota exceeded — log just won't persist
          }
          return next
        })

        if (desktopEnabled) {
          for (const entry of newEntries) fireDesktopNotification(entry)
        }
      }
    }

    prevByKey.current = nextByKey
  }, [data, desktopEnabled])

  const markSeen = useCallback(() => {
    const now = new Date().toISOString()
    setSeenAt(now)
    try {
      localStorage.setItem(SEEN_KEY, now)
    } catch {
      // private browsing / quota exceeded — read state just won't persist
    }
  }, [])

  const clear = useCallback(() => {
    setEntries([])
    try {
      localStorage.removeItem(LOG_KEY)
    } catch {
      // private browsing / quota exceeded — nothing to clean up
    }
  }, [])

  const unseenCount = entries.filter((e) => e.at > seenAt).length

  return { entries, unseenCount, markSeen, clear }
}
