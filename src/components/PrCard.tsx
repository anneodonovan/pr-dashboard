import type { CiStatus, Pr, ReviewState, Staleness } from '../../server/types'
import { formatRelativeTime } from '../lib/formatRelativeTime'

const CI_LABEL: Record<CiStatus, { label: string; className: string }> = {
  success: { label: 'CI passing', className: 'bg-emerald-500/15 text-emerald-400' },
  failure: { label: 'CI failing', className: 'bg-red-500/15 text-red-400' },
  pending: { label: 'CI running', className: 'bg-amber-500/15 text-amber-400' },
  unknown: { label: 'No CI', className: 'bg-slate-500/15 text-slate-400' },
}

const STALENESS_LABEL: Record<Staleness, { label: string; className: string } | null> = {
  'up-to-date': null,
  'needs-rebase': { label: 'Needs rebase', className: 'bg-amber-500/15 text-amber-400' },
  conflicts: { label: 'Conflicts', className: 'bg-red-500/15 text-red-400' },
}

const REVIEW_RING: Record<ReviewState, string> = {
  approved: 'ring-emerald-400',
  'changes-requested': 'ring-red-400',
  commented: 'ring-sky-400',
  pending: 'ring-slate-500 ring-dashed',
}

function initials(login: string): string {
  return login.slice(0, 2).toUpperCase()
}

function ReviewerAvatar({ login, state }: { login: string; state: ReviewState }) {
  return (
    <div
      title={`${login}: ${state.replace('-', ' ')}`}
      className={`flex h-7 w-7 items-center justify-center rounded-full bg-slate-800 text-[10px] font-medium text-slate-200 ring-2 ${REVIEW_RING[state]}`}
    >
      {initials(login)}
    </div>
  )
}

export function PrCard({ pr }: { pr: Pr }) {
  const staleness = STALENESS_LABEL[pr.staleness]
  const ci = CI_LABEL[pr.ciStatus]

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">
      <div className="flex items-start justify-between gap-3">
        <a
          href={pr.url}
          target="_blank"
          rel="noreferrer"
          className="font-medium text-slate-100 hover:text-sky-400 hover:underline"
        >
          {pr.title}
        </a>
        <span className="whitespace-nowrap text-xs text-slate-500">{formatRelativeTime(pr.updatedAt)}</span>
      </div>

      <div className="mt-1 text-xs text-slate-500">
        {pr.repo.split('/')[1]} #{pr.number}
        {pr.isDraft && <span className="ml-2 rounded bg-slate-700 px-1.5 py-0.5 text-slate-300">Draft</span>}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-1 text-xs font-medium ${ci.className}`}>{ci.label}</span>
        {staleness && <span className={`rounded px-2 py-1 text-xs font-medium ${staleness.className}`}>{staleness.label}</span>}
        {pr.unaddressedThreads.length > 0 && (
          <span
            title={pr.unaddressedThreads.map((t) => `${t.author}: ${t.preview}`).join('\n\n')}
            className="rounded bg-fuchsia-500/15 px-2 py-1 text-xs font-medium text-fuchsia-400"
          >
            {pr.unaddressedThreads.length} unaddressed
          </span>
        )}
      </div>

      {pr.reviewers.length > 0 && (
        <div className="mt-3 flex items-center gap-1.5">
          {pr.reviewers.map((r) => (
            <ReviewerAvatar key={r.login} login={r.login} state={r.state} />
          ))}
        </div>
      )}
    </div>
  )
}
