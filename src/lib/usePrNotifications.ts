import { useEffect, useRef } from 'react'
import type { DashboardData, Pr } from '../../server/types'

interface PrSnapshot {
  title: string
  url: string
  approved: boolean
  conflicts: boolean
  unaddressedUrls: Set<string>
}

function prKey(pr: Pr): string {
  return `${pr.repo}#${pr.number}`
}

function snapshot(pr: Pr): PrSnapshot {
  return {
    title: pr.title,
    url: pr.url,
    approved: pr.status === 'approved' || pr.status === 'ready-to-merge',
    conflicts: pr.staleness === 'conflicts',
    unaddressedUrls: new Set(pr.unaddressedThreads.map((t) => t.url)),
  }
}

function notify(title: string, body: string, url: string) {
  const n = new Notification(title, { body, tag: url })
  n.onclick = () => {
    window.focus()
    window.open(url, '_blank')
    n.close()
  }
}

/**
 * Fires a desktop notification for the specific PR events worth
 * interrupting for: a new unaddressed comment, a PR becoming approved, or
 * conflicts appearing. Compares each poll against the previous one, so it's
 * silent on first load and never repeats for a state that's already true.
 */
export function usePrNotifications(data: DashboardData | null, enabled: boolean) {
  const prevByKey = useRef<Map<string, PrSnapshot> | null>(null)

  useEffect(() => {
    if (!data) return

    const nextByKey = new Map(data.prs.map((pr) => [prKey(pr), snapshot(pr)]))

    if (enabled && prevByKey.current) {
      const prev = prevByKey.current
      for (const pr of data.prs) {
        const before = prev.get(prKey(pr))
        if (!before) continue
        const after = nextByKey.get(prKey(pr))!

        const newComment = [...after.unaddressedUrls].some((url) => !before.unaddressedUrls.has(url))
        if (newComment) {
          notify(`New comment: #${pr.number}`, pr.title, pr.url)
        }

        if (after.approved && !before.approved) {
          notify(`Approved: #${pr.number}`, pr.title, pr.url)
        }

        if (after.conflicts && !before.conflicts) {
          notify(`Conflicts: #${pr.number}`, pr.title, pr.url)
        }
      }
    }

    prevByKey.current = nextByKey
  }, [data, enabled])
}
