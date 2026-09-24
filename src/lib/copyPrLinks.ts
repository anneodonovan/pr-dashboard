import type { Pr } from '../../server/types'
import { STATUS_LABEL, STATUS_ORDER } from './labels'
import { sortPrs, type SortMode } from './sortPrs'

/** Same grouping/ordering as the Kanban board: by status column, then sort mode within each. */
export function buildPrLinksText(prs: Pr[], sortMode: SortMode): string {
  return STATUS_ORDER.flatMap((status) =>
    sortPrs(
      prs.filter((pr) => pr.status === status),
      sortMode,
    ).map((pr) => `${pr.url} - ${STATUS_LABEL[status].label}`),
  ).join('\n')
}
