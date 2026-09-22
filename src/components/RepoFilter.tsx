export function RepoFilter({
  repos,
  excluded,
  onToggle,
}: {
  repos: Array<{ repo: string; count: number }>
  excluded: Set<string>
  onToggle: (repo: string) => void
}) {
  if (repos.length < 2) return null

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500">Repos</span>
      {repos.map(({ repo, count }) => {
        const isExcluded = excluded.has(repo)
        return (
          <button
            key={repo}
            onClick={() => onToggle(repo)}
            className={`rounded-full border px-2.5 py-1 text-xs font-medium transition-colors ${
              isExcluded
                ? 'border-slate-800 text-slate-600 hover:border-slate-700 hover:text-slate-400'
                : 'border-sky-500/40 bg-sky-500/10 text-sky-300'
            }`}
          >
            {repo.split('/')[1]} <span className="opacity-60">{count}</span>
          </button>
        )
      })}
    </div>
  )
}
