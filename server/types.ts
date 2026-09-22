export type CiStatus = 'success' | 'failure' | 'pending' | 'unknown'

export type Staleness = 'up-to-date' | 'needs-rebase' | 'conflicts'

export type ReviewState = 'approved' | 'changes-requested' | 'commented' | 'pending'

export interface Reviewer {
  login: string
  state: ReviewState
  submittedAt: string | null
}

export interface UnaddressedThread {
  /** First ~120 chars of the thread's opening comment, for a hover preview. */
  preview: string
  author: string
  url: string
}

export interface Pr {
  repo: string
  number: number
  title: string
  url: string
  isDraft: boolean
  updatedAt: string
  headRefName: string
  baseRefName: string
  ciStatus: CiStatus
  staleness: Staleness
  reviewDecision: string | null
  reviewers: Reviewer[]
  unaddressedThreads: UnaddressedThread[]
}

export interface PrStack {
  repo: string
  /** PRs ordered base -> top of stack. */
  prs: Pr[]
}

export interface DashboardData {
  viewerLogin: string
  fetchedAt: string
  stacks: PrStack[]
  standalone: Pr[]
  /** Set when the last refresh attempt failed; the data shown is the last good snapshot. */
  error: string | null
}
