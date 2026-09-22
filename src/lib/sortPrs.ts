import type { Pr, Staleness } from '../../server/types'

export type SortMode = 'updated' | 'staleness'

const STALENESS_RANK: Record<Staleness, number> = {
  conflicts: 0,
  'needs-rebase': 1,
  'up-to-date': 2,
}

/**
 * 'staleness': broken PRs (conflicts, then needs-rebase) first, then within
 * each tier the longest-idle PRs first — the two senses of "stale" combined.
 * 'updated': most recently active PR first (the default).
 */
export function sortPrs(prs: Pr[], mode: SortMode): Pr[] {
  const sorted = [...prs]
  if (mode === 'staleness') {
    sorted.sort((a, b) => {
      const rankDiff = STALENESS_RANK[a.staleness] - STALENESS_RANK[b.staleness]
      if (rankDiff !== 0) return rankDiff
      return new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()
    })
  } else {
    sorted.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }
  return sorted
}
