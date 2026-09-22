import type { Theme } from '../lib/useTheme'

export function ThemeToggle({ theme, onToggle }: { theme: Theme; onToggle: () => void }) {
  const isDark = theme === 'dark'
  return (
    <button
      onClick={onToggle}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className="rounded-md border border-slate-800 bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 light:border-slate-200 light:bg-white light:text-slate-700 light:hover:bg-slate-100"
    >
      {isDark ? '☀' : '☾'}
    </button>
  )
}
