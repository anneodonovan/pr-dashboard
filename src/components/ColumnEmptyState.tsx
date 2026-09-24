import type { PrStatus } from '../../server/types'

const COPY: Record<PrStatus, { icon: string; title: string; subtitle: string }> = {
  draft: { icon: '✦', title: 'Nothing in draft', subtitle: 'No drafts right now' },
  'no-reviewer': { icon: '✦', title: 'Nothing here yet', subtitle: 'Every PR has a reviewer' },
  'waiting-for-approval': { icon: '✦', title: 'Nothing waiting', subtitle: "You're all caught up" },
  'changes-requested': { icon: '✓', title: 'Nothing here yet', subtitle: 'All caught up! 🎉' },
  approved: { icon: '✦', title: 'Nothing approved yet', subtitle: 'Nothing pending a merge check' },
  'ready-to-merge': { icon: '🚀', title: 'Nothing ready to merge', subtitle: 'Great work!' },
}

export function ColumnEmptyState({ status }: { status: PrStatus }) {
  const copy = COPY[status]
  return (
    <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-800/70 px-4 py-10 text-center light:border-slate-300">
      <span className="text-xl text-slate-600 light:text-slate-400">{copy.icon}</span>
      <div className="text-sm font-medium text-slate-400 light:text-slate-600">{copy.title}</div>
      <div className="text-xs text-slate-600 light:text-slate-400">{copy.subtitle}</div>
    </div>
  )
}
