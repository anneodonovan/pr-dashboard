import { motion } from 'motion/react'
import type { Pr } from '../../server/types'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { CI_LABEL, REVIEW_CHIP, STALENESS_LABEL } from '../lib/labels'
import { isTooBig, tooBigReason, TOO_BIG_BADGE_CLASSNAME } from '../lib/prSize'
import { StackProgress } from './StackProgress'

const RECENT_MS = 5 * 60 * 1000

export function PrCard({
  pr,
  onSelect,
  isDismissed,
}: {
  pr: Pr
  onSelect?: (pr: Pr) => void
  isDismissed: (url: string) => boolean
}) {
  const staleness = STALENESS_LABEL[pr.staleness]
  const ci = CI_LABEL[pr.ciStatus]
  const activeUnaddressed = pr.unaddressedThreads.filter((t) => !isDismissed(t.url))
  const hasUnaddressed = activeUnaddressed.length > 0
  const hasConflicts = pr.staleness === 'conflicts'
  const needsRebase = pr.staleness === 'needs-rebase'
  const isRecent = Date.now() - new Date(pr.updatedAt).getTime() < RECENT_MS

  const cardTint = hasUnaddressed
    ? 'border-fuchsia-500/30 bg-fuchsia-500/[0.06] hover:border-fuchsia-500/50'
    : hasConflicts
      ? 'border-red-500/30 bg-red-500/[0.06] hover:border-red-500/50'
      : needsRebase
        ? 'border-amber-500/30 bg-amber-500/[0.06] hover:border-amber-500/50'
        : 'border-slate-800/80 bg-slate-900/60 hover:border-slate-600 light:border-slate-200 light:bg-white light:hover:border-slate-300'

  return (
    <motion.div
      onClick={() => onSelect?.(pr)}
      className={`group cursor-pointer rounded-xl border p-4 backdrop-blur-sm transition-colors ${cardTint}`}
      whileHover={{ y: -3, boxShadow: '0 12px 28px -12px rgba(99, 102, 241, 0.35)' }}
      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
    >
      <div className="flex items-start justify-between gap-3">
        <a
          href={pr.url}
          target="_blank"
          rel="noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="font-medium text-slate-100 hover:text-sky-400 light:text-slate-900 light:hover:text-sky-700"
        >
          {pr.title}
        </a>
        <div className="flex shrink-0 items-center gap-1.5">
          {isRecent && (
            <span className="relative flex h-1.5 w-1.5" title="Updated in the last few minutes">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-400" />
            </span>
          )}
          <span className="whitespace-nowrap text-xs text-slate-500">{formatRelativeTime(pr.updatedAt)}</span>
          <span className="translate-x-[-2px] text-sm text-slate-600 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100 light:text-slate-400">
            →
          </span>
        </div>
      </div>

      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
        <span>
          {pr.repo.split('/')[1]} #{pr.number}
        </span>
        <span className="font-mono">
          <span className="text-emerald-500">+{pr.additions}</span> <span className="text-red-500">-{pr.deletions}</span>
        </span>
        {pr.stack && <StackProgress position={pr.stack.position} total={pr.stack.total} prNumbers={pr.stack.prNumbers} />}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className={`rounded px-2 py-1 text-xs font-medium ${ci.className}`}>{ci.label}</span>
        {staleness && <span className={`rounded px-2 py-1 text-xs font-medium ${staleness.className}`}>{staleness.label}</span>}
        {isTooBig(pr) && (
          <span title={tooBigReason(pr)} className={`rounded px-2 py-1 text-xs font-medium ${TOO_BIG_BADGE_CLASSNAME}`}>
            Too big
          </span>
        )}
        {activeUnaddressed.length > 0 && (
          <span
            title={activeUnaddressed.map((t) => `${t.author}: ${t.body.slice(0, 140)}`).join('\n\n')}
            className="rounded bg-fuchsia-500/15 px-2 py-1 text-xs font-medium text-fuchsia-400 light:text-fuchsia-700"
          >
            {activeUnaddressed.length} unaddressed
          </span>
        )}
      </div>

      {pr.reviewers.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {pr.reviewers.map((r) => (
            <span
              key={r.login}
              title={r.login}
              className={`rounded-full border px-2 py-0.5 text-xs ${REVIEW_CHIP[r.state]}`}
            >
              {r.name || r.login}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  )
}
