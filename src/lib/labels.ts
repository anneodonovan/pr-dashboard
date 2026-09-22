import type { CiStatus, PrStatus, ReviewState, Staleness } from '../../server/types'

export const STATUS_LABEL: Record<PrStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-700/50 text-slate-300' },
  'no-reviewer': { label: 'No reviewer assigned', className: 'bg-orange-500/15 text-orange-400' },
  'changes-requested': { label: 'Changes requested', className: 'bg-red-500/15 text-red-400' },
  'waiting-for-approval': { label: 'Waiting for approval', className: 'bg-amber-500/15 text-amber-400' },
  approved: { label: 'Approved', className: 'bg-emerald-500/15 text-emerald-400' },
  'ready-to-merge': { label: 'Ready to merge', className: 'bg-emerald-500/25 text-emerald-300' },
}

/** Kanban column order — roughly the lifecycle of a PR. */
export const STATUS_ORDER: PrStatus[] = [
  'draft',
  'no-reviewer',
  'waiting-for-approval',
  'changes-requested',
  'approved',
  'ready-to-merge',
]

export const STATUS_DOT: Record<PrStatus, string> = {
  draft: 'bg-slate-400',
  'no-reviewer': 'bg-orange-400',
  'changes-requested': 'bg-red-400',
  'waiting-for-approval': 'bg-amber-400',
  approved: 'bg-emerald-400',
  'ready-to-merge': 'bg-emerald-300',
}

export const CI_LABEL: Record<CiStatus, { label: string; className: string }> = {
  success: { label: 'CI passing', className: 'bg-emerald-500/15 text-emerald-400' },
  failure: { label: 'CI failing', className: 'bg-red-500/15 text-red-400' },
  pending: { label: 'CI running', className: 'bg-amber-500/15 text-amber-400' },
  unknown: { label: 'No CI', className: 'bg-slate-500/15 text-slate-400' },
}

export const STALENESS_LABEL: Record<Staleness, { label: string; className: string } | null> = {
  'up-to-date': null,
  'needs-rebase': { label: 'Needs rebase', className: 'bg-amber-500/15 text-amber-400' },
  conflicts: { label: 'Conflicts', className: 'bg-red-500/15 text-red-400' },
}

export const REVIEW_CHIP: Record<ReviewState, string> = {
  approved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300',
  'changes-requested': 'border-red-500/40 bg-red-500/10 text-red-300',
  commented: 'border-sky-500/40 bg-sky-500/10 text-sky-300',
  pending: 'border-slate-600 border-dashed bg-slate-800 text-slate-400',
}

export const REVIEW_STATE_LABEL: Record<ReviewState, string> = {
  approved: 'Approved',
  'changes-requested': 'Changes requested',
  commented: 'Commented',
  pending: 'Pending',
}

export function checkStatusColor(status: string): string {
  const s = status.toLowerCase()
  if (['success', 'success_state'].includes(s)) return 'bg-emerald-400'
  if (['failure', 'error', 'failure_state', 'error_state'].includes(s)) return 'bg-red-400'
  if (['pending', 'in_progress', 'queued', 'pending_state'].includes(s)) return 'bg-amber-400'
  return 'bg-slate-500'
}
