import { useState } from 'react'
import type { Pr } from '../../server/types'
import { buildPrLinksText } from '../lib/copyPrLinks'
import type { SortMode } from '../lib/sortPrs'

export function CopyLinksButton({ prs, sortMode }: { prs: Pr[]; sortMode: SortMode }) {
  const [copied, setCopied] = useState(false)

  const handleClick = async () => {
    const text = buildPrLinksText(prs, sortMode)
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // clipboard access denied or unavailable — nothing more we can do
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={prs.length === 0}
      className="rounded-md bg-slate-800 px-3 py-1.5 text-sm font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-50 light:bg-slate-100 light:text-slate-700 light:hover:bg-slate-200"
    >
      {copied ? 'Copied!' : 'Copy links'}
    </button>
  )
}
