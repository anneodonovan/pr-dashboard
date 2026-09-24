export function NotificationBell({ unseenCount, onClick }: { unseenCount: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      title="Notifications"
      aria-label={`Notifications${unseenCount > 0 ? ` (${unseenCount} unread)` : ''}`}
      className="relative rounded-md border border-slate-800 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 light:border-slate-200 light:bg-white light:text-slate-700 light:hover:bg-slate-100"
    >
      🔔
      {unseenCount > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold text-white">
          {unseenCount > 9 ? '9+' : unseenCount}
        </span>
      )}
    </button>
  )
}
