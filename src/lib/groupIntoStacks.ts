import type { Pr } from '../../server/types'

/**
 * Clusters an already-sorted PR list so stack siblings sit adjacent to each
 * other (base first), while everything else keeps its original relative
 * order. A group's position in the result is wherever its first (best
 * sorted) member appeared in the input.
 */
export function groupIntoStacks(prs: Pr[]): Pr[][] {
  const groups: Pr[][] = []
  const groupIndexByKey = new Map<string, number>()

  for (const pr of prs) {
    const key = pr.stack ? `${pr.repo}#${pr.stack.prNumbers.join(',')}` : null
    const existingIndex = key ? groupIndexByKey.get(key) : undefined
    if (existingIndex !== undefined) {
      groups[existingIndex].push(pr)
      continue
    }
    if (key) groupIndexByKey.set(key, groups.length)
    groups.push([pr])
  }

  for (const group of groups) {
    if (group.length > 1) {
      group.sort((a, b) => (a.stack?.position ?? 0) - (b.stack?.position ?? 0))
    }
  }

  return groups
}
