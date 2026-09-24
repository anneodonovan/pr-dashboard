import type { Pr } from '../../server/types'
import { STATUS_ORDER } from './labels'
import { sortPrs, type SortMode } from './sortPrs'

/**
 * Status phrasing for the copied text — action-oriented rather than the
 * column titles, since "waiting for approval" covers both a PR that's never
 * been looked at and one where the author already pushed fixes after a
 * changes-requested round.
 */
function copyStatusLabel(pr: Pr): string {
  switch (pr.status) {
    case 'draft':
      return 'Draft, not ready for review'
    case 'no-reviewer':
      return 'Needs a reviewer assigned'
    case 'waiting-for-approval': {
      const hasPriorReview = pr.reviewers.some((r) => r.state !== 'pending')
      return hasPriorReview ? 'Ready for re-review' : 'Ready for review'
    }
    case 'changes-requested':
      return 'Changes requested, needs updates'
    case 'approved':
      return 'Approved, blocked on merge checks'
    case 'ready-to-merge':
      return 'Approved, ready to merge'
  }
}

/** Same grouping/ordering as the Kanban board: by status column, then sort mode within each. */
export function buildPrLinksText(prs: Pr[], sortMode: SortMode): string {
  return STATUS_ORDER.flatMap((status) =>
    sortPrs(
      prs.filter((pr) => pr.status === status),
      sortMode,
    ).map((pr) => `${pr.url} - ${copyStatusLabel(pr)}`),
  ).join('\n')
}
