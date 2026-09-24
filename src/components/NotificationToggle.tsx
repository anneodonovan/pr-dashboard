export function NotificationToggle({
  enabled,
  permission,
  onToggle,
}: {
  enabled: boolean
  permission: NotificationPermission
  onToggle: () => void
}) {
  const blocked = permission === 'denied'
  const title = blocked
    ? 'Notifications blocked in browser settings'
    : enabled
      ? 'Desktop notifications on — click to turn off'
      : 'Turn on desktop notifications for new comments, approvals, and conflicts'

  return (
    <button
      onClick={onToggle}
      disabled={blocked}
      title={title}
      aria-label={title}
      aria-pressed={enabled}
      className="rounded-md border border-slate-800 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40 light:border-slate-200 light:bg-white light:text-slate-700 light:hover:bg-slate-100"
    >
      {enabled ? '🔔' : '🔕'}
    </button>
  )
}
