import type { Pr } from '../../server/types'

export const TOO_BIG_LINES = 500
export const TOO_BIG_FILES = 10

export const TOO_BIG_BADGE_CLASSNAME = 'bg-violet-500/15 text-violet-400 light:text-violet-700'

export function isTooBig(pr: Pick<Pr, 'additions' | 'deletions' | 'changedFiles'>): boolean {
  return pr.additions + pr.deletions > TOO_BIG_LINES || pr.changedFiles > TOO_BIG_FILES
}

export function tooBigReason(pr: Pick<Pr, 'additions' | 'deletions' | 'changedFiles'>): string {
  const lines = pr.additions + pr.deletions
  return `${lines.toLocaleString()} lines changed across ${pr.changedFiles} files — consider splitting into a stack`
}
