import { formatRelativeTime } from '../lib/formatRelativeTime'
import type { NotificationEntry } from '../lib/usePrNotifications'

const KIND_ICON: Record<NotificationEntry['kind'], string> = {
  comment: '💬',
  approved: '✅',
  conflicts: '⚠️',
}

export function NotificationCenter({
  entries,
  onClose,
  onClear,
  desktopEnabled,
  desktopPermission,
  onToggleDesktop,
}: {
  entries: NotificationEntry[]
  onClose: () => void
  onClear: () => void
  desktopEnabled: boolean
  desktopPermission: NotificationPermission
  onToggleDesktop: () => void
}) {
  const blocked = desktopPermission === 'denied'

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-6 top-20 z-50 max-h-[70vh] w-full max-w-md overflow-y-auto rounded-xl border border-slate-800 bg-slate-900 shadow-2xl light:border-slate-200 light:bg-white">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3 light:border-slate-200">
          <div className="text-sm font-semibold text-slate-100 light:text-slate-900">Notifications</div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 light:text-slate-500 light:hover:bg-slate-100 light:hover:text-slate-900"
          >
            ✕
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 border-b border-slate-800 px-4 py-2.5 light:border-slate-200">
          <div className="text-xs text-slate-500">
            {blocked ? 'Desktop notifications blocked in browser settings' : 'Desktop notifications'}
          </div>
          <button
            onClick={onToggleDesktop}
            disabled={blocked}
            title={
              blocked
                ? 'Blocked — check your browser/OS notification settings for this site'
                : desktopEnabled
                  ? 'Click to turn off'
                  : 'Click to turn on'
            }
            className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-medium disabled:cursor-not-allowed disabled:opacity-40 ${
              desktopEnabled
                ? 'bg-emerald-500/15 text-emerald-400 light:text-emerald-700'
                : 'bg-slate-800 text-slate-400 light:bg-slate-100 light:text-slate-600'
            }`}
          >
            {desktopEnabled ? 'On' : 'Off'}
          </button>
        </div>

        {entries.length === 0 ? (
          <div className="px-4 py-10 text-center text-sm text-slate-500">
            Nothing yet — new comments, approvals, and conflicts will show up here.
          </div>
        ) : (
          <div className="divide-y divide-slate-800 light:divide-slate-200">
            {entries.map((e) => (
              <a
                key={e.id}
                href={e.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-start gap-3 px-4 py-3 hover:bg-slate-800/40 light:hover:bg-slate-100"
              >
                <span className="text-base leading-none">{KIND_ICON[e.kind]}</span>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-sm font-medium text-slate-100 light:text-slate-900">{e.title}</div>
                  <div className="truncate text-xs text-slate-500">{e.detail}</div>
                </div>
                <span className="shrink-0 text-xs text-slate-600">{formatRelativeTime(e.at)}</span>
              </a>
            ))}
          </div>
        )}

        {entries.length > 0 && (
          <div className="border-t border-slate-800 px-4 py-2 light:border-slate-200">
            <button onClick={onClear} className="text-xs text-slate-500 hover:text-slate-300 light:hover:text-slate-700">
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  )
}
