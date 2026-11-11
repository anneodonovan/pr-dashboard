import { describe, expect, test } from 'bun:test'
import { annotateStacks } from '../server/buildStacks'
import type { Pr } from '../server/types'
import { buildPrLinksText } from '../src/lib/copyPrLinks'
import { groupIntoStacks } from '../src/lib/groupIntoStacks'
import { sortPrs } from '../src/lib/sortPrs'

function pr(overrides: Partial<Pr> = {}): Pr {
  return {
    repo: 'example/repo',
    number: 1,
    title: 'A pull request',
    body: '',
    url: 'https://github.com/example/repo/pull/1',
    isDraft: false,
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-02T00:00:00Z',
    headRefName: 'feature',
    baseRefName: 'main',
    status: 'waiting-for-approval',
    ciStatus: 'success',
    checks: [],
    staleness: 'up-to-date',
    reviewDecision: null,
    reviewers: [],
    unaddressedThreads: [],
    additions: 1,
    deletions: 1,
    changedFiles: 1,
    commitsCount: 1,
    commentsCount: 0,
    stack: null,
    ...overrides,
  }
}

describe('annotateStacks', () => {
  test('annotates chained pull requests in base-to-head order', () => {
    const prs = [
      pr({ number: 3, headRefName: 'feature-3', baseRefName: 'feature-2' }),
      pr({ number: 1, headRefName: 'feature-1' }),
      pr({ number: 2, headRefName: 'feature-2', baseRefName: 'feature-1' }),
    ]

    annotateStacks(prs)

    expect(prs.map(({ number, stack }) => ({ number, stack }))).toEqual([
      { number: 3, stack: { position: 3, total: 3, prNumbers: [1, 2, 3] } },
      { number: 1, stack: { position: 1, total: 3, prNumbers: [1, 2, 3] } },
      { number: 2, stack: { position: 2, total: 3, prNumbers: [1, 2, 3] } },
    ])
  })

  test('does not combine pull requests from different repositories', () => {
    const prs = [
      pr({ repo: 'example/one', number: 1, headRefName: 'feature-1' }),
      pr({
        repo: 'example/two',
        number: 2,
        headRefName: 'feature-2',
        baseRefName: 'feature-1',
      }),
    ]

    annotateStacks(prs)

    expect(prs.every(({ stack }) => stack === null)).toBe(true)
  })
})

describe('groupIntoStacks', () => {
  test('keeps stack members together and orders them by position', () => {
    const stack = { position: 1, total: 2, prNumbers: [1, 2] }
    const prs = [
      pr({ number: 2, stack: { ...stack, position: 2 } }),
      pr({ number: 9 }),
      pr({ number: 1, stack }),
    ]

    expect(groupIntoStacks(prs).map((group) => group.map(({ number }) => number))).toEqual([
      [1, 2],
      [9],
    ])
  })
})

describe('sortPrs', () => {
  test('sorts conflicts before needs-rebase and oldest first within a tier', () => {
    const prs = [
      pr({ number: 1, staleness: 'needs-rebase', updatedAt: '2026-01-03T00:00:00Z' }),
      pr({ number: 2, staleness: 'conflicts', updatedAt: '2026-01-04T00:00:00Z' }),
      pr({ number: 3, staleness: 'conflicts', updatedAt: '2026-01-01T00:00:00Z' }),
    ]

    expect(sortPrs(prs, 'staleness').map(({ number }) => number)).toEqual([3, 2, 1])
  })

  test('does not mutate the input list', () => {
    const prs = [pr({ number: 1 }), pr({ number: 2, updatedAt: '2026-01-03T00:00:00Z' })]
    const original = [...prs]

    sortPrs(prs, 'updated')

    expect(prs).toEqual(original)
  })
})

describe('buildPrLinksText', () => {
  test('groups by status and uses the selected sort mode', () => {
    const prs = [
      pr({
        number: 1,
        status: 'approved',
        updatedAt: '2026-01-01T00:00:00Z',
        url: 'https://github.com/example/repo/pull/1',
      }),
      pr({
        number: 2,
        status: 'draft',
        updatedAt: '2026-01-03T00:00:00Z',
        url: 'https://github.com/example/repo/pull/2',
      }),
    ]

    expect(buildPrLinksText(prs, 'updated')).toBe(
      'https://github.com/example/repo/pull/2 - Draft, not ready for review\n' +
        'https://github.com/example/repo/pull/1 - Approved, blocked on merge checks',
    )
  })
})
