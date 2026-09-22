import { useState } from 'react'
import type { Pr } from '../../server/types'
import { formatRelativeTime } from '../lib/formatRelativeTime'
import { CI_LABEL, REVIEW_CHIP, REVIEW_STATE_LABEL, STALENESS_LABEL, STATUS_LABEL, checkStatusColor } from '../lib/labels'

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md bg-slate-800/60 px-3 py-2">
      <div className="text-[10px] uppercase tracking-wide text-slate-500">{label}</div>
      <div className="text-sm font-medium text-slate-100">{value}</div>
    </div>
  )
}

export function PrDetailPanel({
  pr,
  onClose,
  isDismissed,
  dismiss,
  undismiss,
}: {
  pr: Pr
  onClose: () => void
  isDismissed: (url: string) => boolean
  dismiss: (url: string) => void
  undismiss: (url: string) => void
}) {
  const staleness = STALENESS_LABEL[pr.staleness]
  const ci = CI_LABEL[pr.ciStatus]
  const status = STATUS_LABEL[pr.status]
  const [showSeen, setShowSeen] = useState(false)

  const activeThreads = pr.unaddressedThreads.filter((t) => !isDismissed(t.url))
  const seenThreads = pr.unaddressedThreads.filter((t) => isDismissed(t.url))

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 z-50 h-full w-full max-w-lg overflow-y-auto border-l border-slate-800 bg-slate-900 p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <a
            href={pr.url}
            target="_blank"
            rel="noreferrer"
            className="text-lg font-semibold text-slate-100 hover:text-sky-400 hover:underline"
          >
            {pr.title}
          </a>
          <button
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            ✕
          </button>
        </div>

        <div className="mt-1 text-sm text-slate-500">
          {pr.repo} #{pr.number} &middot; opened {formatRelativeTime(pr.createdAt)} &middot; updated{' '}
          {formatRelativeTime(pr.updatedAt)}
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <span className={`rounded px-2 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
          <span className={`rounded px-2 py-1 text-xs font-medium ${ci.className}`}>{ci.label}</span>
          {staleness && <span className={`rounded px-2 py-1 text-xs font-medium ${staleness.className}`}>{staleness.label}</span>}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2">
          <Stat label="Additions" value={`+${pr.additions}`} />
          <Stat label="Deletions" value={`-${pr.deletions}`} />
          <Stat label="Files changed" value={pr.changedFiles} />
          <Stat label="Commits" value={pr.commitsCount} />
          <Stat label="Comments" value={pr.commentsCount} />
          <Stat label="Base branch" value={pr.baseRefName} />
        </div>

        {pr.body && (
          <div className="mt-5">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Description</div>
            <div className="max-h-48 overflow-y-auto whitespace-pre-wrap rounded-md bg-slate-800/40 p-3 text-sm text-slate-300">
              {pr.body}
            </div>
          </div>
        )}

        {pr.reviewers.length > 0 && (
          <div className="mt-5">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Reviewers</div>
            <div className="space-y-1.5">
              {pr.reviewers.map((r) => (
                <div key={r.login} className="flex items-center justify-between rounded-md bg-slate-800/40 px-3 py-1.5">
                  <span className="text-sm text-slate-200">
                    {r.name || r.login}
                    {r.name && <span className="ml-1.5 text-xs text-slate-500">@{r.login}</span>}
                  </span>
                  <span className={`rounded-full border px-2 py-0.5 text-xs ${REVIEW_CHIP[r.state]}`}>
                    {REVIEW_STATE_LABEL[r.state]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {pr.checks.length > 0 && (
          <div className="mt-5">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-slate-500">Checks</div>
            <div className="space-y-1">
              {pr.checks.map((check, i) => (
                <a
                  key={`${check.name}-${i}`}
                  href={check.url ?? pr.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-2 rounded-md px-3 py-1.5 text-sm text-slate-300 hover:bg-slate-800/40"
                >
                  <span className={`h-2 w-2 shrink-0 rounded-full ${checkStatusColor(check.status)}`} />
                  <span className="truncate">{check.name}</span>
                </a>
              ))}
            </div>
          </div>
        )}

        {activeThreads.length > 0 && (
          <div className="mt-5">
            <div className="mb-1.5 text-xs font-medium uppercase tracking-wide text-fuchsia-400">
              Unaddressed comments ({activeThreads.length})
            </div>
            <div className="space-y-2">
              {activeThreads.map((t, i) => (
                <div key={i} className="rounded-md border border-fuchsia-500/20 bg-fuchsia-500/5 px-3 py-2 text-sm">
                  <div className="flex items-start justify-between gap-2">
                    <a href={t.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-fuchsia-400 hover:underline">
                      {t.author}
                    </a>
                    <button
                      onClick={() => dismiss(t.url)}
                      className="shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 hover:border-slate-500 hover:text-slate-200"
                    >
                      Mark as seen
                    </button>
                  </div>
                  <a href={t.url} target="_blank" rel="noreferrer" className="mt-0.5 block text-slate-300 hover:text-slate-100">
                    {t.preview}
                  </a>
                </div>
              ))}
            </div>
          </div>
        )}

        {seenThreads.length > 0 && (
          <div className="mt-5">
            <button
              onClick={() => setShowSeen((v) => !v)}
              className="text-xs font-medium uppercase tracking-wide text-slate-500 hover:text-slate-300"
            >
              {showSeen ? 'Hide' : 'Show'} {seenThreads.length} marked as seen
            </button>
            {showSeen && (
              <div className="mt-2 space-y-2">
                {seenThreads.map((t, i) => (
                  <div key={i} className="rounded-md border border-slate-800 bg-slate-800/20 px-3 py-2 text-sm opacity-60">
                    <div className="flex items-start justify-between gap-2">
                      <a href={t.url} target="_blank" rel="noreferrer" className="text-xs font-medium text-slate-400 hover:underline">
                        {t.author}
                      </a>
                      <button
                        onClick={() => undismiss(t.url)}
                        className="shrink-0 rounded border border-slate-700 px-1.5 py-0.5 text-[10px] text-slate-400 hover:border-slate-500 hover:text-slate-200"
                      >
                        Undo
                      </button>
                    </div>
                    <div className="mt-0.5 text-slate-400">{t.preview}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}
