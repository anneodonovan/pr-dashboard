import type { SortMode } from '../lib/sortPrs'

const OPTIONS: Array<{ mode: SortMode; label: string }> = [
  { mode: 'updated', label: 'Recently updated' },
  { mode: 'staleness', label: 'Stalest first' },
]

export function SortToggle({ mode, onChange }: { mode: SortMode; onChange: (mode: SortMode) => void }) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Sort</span>
      <div className="flex rounded-full border border-slate-800 p-0.5">
        {OPTIONS.map((opt) => (
          <button
            key={opt.mode}
            onClick={() => onChange(opt.mode)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
              mode === opt.mode ? 'bg-sky-500/15 text-sky-300' : 'text-slate-500 hover:text-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  )
}
