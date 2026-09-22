export function UnaddressedToggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
        enabled
          ? 'border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-300 light:text-fuchsia-700'
          : 'border-slate-800 text-slate-500 hover:border-slate-700 hover:text-slate-300 light:border-slate-200 light:hover:border-slate-300 light:hover:text-slate-700'
      }`}
    >
      Unaddressed only
    </button>
  )
}
