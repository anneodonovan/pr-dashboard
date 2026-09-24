import type { CiStatus, PrStatus, ReviewState, Staleness } from '../../server/types'

export const STATUS_LABEL: Record<PrStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-slate-700/50 text-slate-300 light:bg-slate-200 light:text-slate-700' },
  'no-reviewer': { label: 'No reviewer assigned', className: 'bg-orange-500/15 text-orange-400 light:text-orange-700' },
  'changes-requested': { label: 'Changes requested', className: 'bg-red-500/15 text-red-400 light:text-red-700' },
  'waiting-for-approval': { label: 'Waiting for approval', className: 'bg-amber-500/15 text-amber-400 light:text-amber-700' },
  approved: { label: 'Approved', className: 'bg-emerald-500/15 text-emerald-400 light:text-emerald-700' },
  'ready-to-merge': { label: 'Ready to merge', className: 'bg-emerald-500/25 text-emerald-300 light:text-emerald-700' },
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

/** Soft glow behind each status dot, echoing the column's accent colour. */
export const STATUS_GLOW: Record<PrStatus, string> = {
  draft: 'shadow-[0_0_9px_2px_rgba(148,163,184,0.45)]',
  'no-reviewer': 'shadow-[0_0_9px_2px_rgba(251,146,60,0.5)]',
  'changes-requested': 'shadow-[0_0_9px_2px_rgba(248,113,113,0.5)]',
  'waiting-for-approval': 'shadow-[0_0_9px_2px_rgba(251,191,36,0.5)]',
  approved: 'shadow-[0_0_9px_2px_rgba(52,211,153,0.5)]',
  'ready-to-merge': 'shadow-[0_0_9px_2px_rgba(110,231,183,0.55)]',
}

/** Very faint tinted lane background, ~4-6% opacity, per status column. */
export const STATUS_LANE_BG: Record<PrStatus, string> = {
  draft: 'bg-slate-500/[0.03] border-slate-800/60 light:bg-slate-500/[0.02] light:border-slate-200',
  'no-reviewer': 'bg-orange-500/[0.04] border-orange-500/[0.12] light:bg-orange-500/[0.03] light:border-orange-500/20',
  'changes-requested': 'bg-red-500/[0.04] border-red-500/[0.12] light:bg-red-500/[0.03] light:border-red-500/20',
  'waiting-for-approval': 'bg-amber-500/[0.04] border-amber-500/[0.12] light:bg-amber-500/[0.03] light:border-amber-500/20',
  approved: 'bg-emerald-500/[0.04] border-emerald-500/[0.12] light:bg-emerald-500/[0.03] light:border-emerald-500/20',
  'ready-to-merge': 'bg-emerald-400/[0.05] border-emerald-400/[0.14] light:bg-emerald-400/[0.04] light:border-emerald-400/20',
}

export const CI_LABEL: Record<CiStatus, { label: string; className: string }> = {
  success: { label: 'CI passing', className: 'bg-emerald-500/15 text-emerald-400 light:text-emerald-700' },
  failure: { label: 'CI failing', className: 'bg-red-500/15 text-red-400 light:text-red-700' },
  pending: { label: 'CI running', className: 'bg-amber-500/15 text-amber-400 light:text-amber-700' },
  unknown: { label: 'No CI', className: 'bg-slate-500/15 text-slate-400 light:text-slate-600' },
}

export const STALENESS_LABEL: Record<Staleness, { label: string; className: string } | null> = {
  'up-to-date': null,
  'needs-rebase': { label: 'Needs rebase', className: 'bg-amber-500/15 text-amber-400 light:text-amber-700' },
  conflicts: { label: 'Conflicts', className: 'bg-red-500/15 text-red-400 light:text-red-700' },
}

export const REVIEW_CHIP: Record<ReviewState, string> = {
  approved: 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 light:text-emerald-700',
  'changes-requested': 'border-red-500/40 bg-red-500/10 text-red-300 light:text-red-700',
  commented: 'border-sky-500/40 bg-sky-500/10 text-sky-300 light:text-sky-700',
  pending: 'border-slate-600 border-dashed bg-slate-800 text-slate-400 light:border-slate-300 light:bg-slate-100 light:text-slate-500',
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
