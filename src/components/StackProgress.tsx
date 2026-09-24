export function StackProgress({ position, total, prNumbers }: { position: number; total: number; prNumbers: number[] }) {
  return (
    <span
      title={`Part ${position} of ${total} stacked PRs: ${prNumbers.map((n) => `#${n}`).join(' → ')}`}
      className="flex items-center gap-1.5 rounded bg-indigo-500/15 py-1 pl-1.5 pr-2 light:bg-indigo-500/10"
    >
      <span className="flex items-center gap-0.5">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => (
          <span
            key={n}
            className={`h-1 w-1 rounded-full transition-colors ${
              n === position
                ? 'bg-indigo-300 shadow-[0_0_5px_rgba(165,180,252,0.9)] light:bg-indigo-600'
                : n < position
                  ? 'bg-indigo-400/60 light:bg-indigo-400'
                  : 'bg-indigo-900/70 light:bg-indigo-200'
            }`}
          />
        ))}
      </span>
      <span className="text-[10px] font-medium text-indigo-300 light:text-indigo-700">
        {position}/{total}
      </span>
    </span>
  )
}
