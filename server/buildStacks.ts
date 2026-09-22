import type { Pr } from './types'

/**
 * Annotates each PR's `.stack` field by walking base-branch -> head-branch
 * chains within each repo. A PR whose baseRefName doesn't match another PR's
 * headRefName (i.e. it's based on the default branch, or on a branch we
 * don't have an open PR for) is a chain root; single-PR "chains" are left
 * as standalone (stack: null).
 */
export function annotateStacks(prs: Pr[]): void {
  const byRepo = new Map<string, Pr[]>()
  for (const pr of prs) {
    const list = byRepo.get(pr.repo) ?? []
    list.push(pr)
    byRepo.set(pr.repo, list)
  }

  for (const repoPrs of byRepo.values()) {
    const byHeadRef = new Map(repoPrs.map((pr) => [pr.headRefName, pr]))
    const childrenByBaseRef = new Map<string, Pr[]>()
    for (const pr of repoPrs) {
      if (byHeadRef.has(pr.baseRefName)) {
        const siblings = childrenByBaseRef.get(pr.baseRefName) ?? []
        siblings.push(pr)
        childrenByBaseRef.set(pr.baseRefName, siblings)
      }
    }

    const roots = repoPrs.filter((pr) => !byHeadRef.has(pr.baseRefName))
    for (const root of roots) {
      const chain: Pr[] = []
      const walk = (pr: Pr) => {
        chain.push(pr)
        for (const child of childrenByBaseRef.get(pr.headRefName) ?? []) walk(child)
      }
      walk(root)

      if (chain.length > 1) {
        const prNumbers = chain.map((pr) => pr.number)
        chain.forEach((pr, i) => {
          pr.stack = { position: i + 1, total: chain.length, prNumbers }
        })
      }
    }
  }
}
