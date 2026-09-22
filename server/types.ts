export type CiStatus = 'success' | 'failure' | 'pending' | 'unknown'

export type Staleness = 'up-to-date' | 'needs-rebase' | 'conflicts'

export type ReviewState = 'approved' | 'changes-requested' | 'commented' | 'pending'

/** A single, primary "where does this PR stand" label, most useful signal wins. */
export type PrStatus =
  | 'draft'
  | 'no-reviewer'
  | 'changes-requested'
  | 'waiting-for-approval'
  | 'approved'
  | 'ready-to-merge'

export interface Reviewer {
  login: string
  name: string | null
  state: ReviewState
  submittedAt: string | null
}

export interface UnaddressedThread {
  /** Full body (markdown) of the outstanding comment. */
  body: string
  author: string
  url: string
}

export interface CheckItem {
  name: string
  /** Lowercased conclusion/state, e.g. 'success', 'failure', 'in_progress'. */
  status: string
  url: string | null
}

export interface StackMembership {
  /** 1-based position, base of the stack first. */
  position: number
  total: number
  /** PR numbers in the stack, base first, in order. */
  prNumbers: number[]
}

export interface Pr {
  repo: string
  number: number
  title: string
  body: string
  url: string
  isDraft: boolean
  createdAt: string
  updatedAt: string
  headRefName: string
  baseRefName: string
  status: PrStatus
  ciStatus: CiStatus
  checks: CheckItem[]
  staleness: Staleness
  reviewDecision: string | null
  reviewers: Reviewer[]
  unaddressedThreads: UnaddressedThread[]
  additions: number
  deletions: number
  changedFiles: number
  commitsCount: number
  commentsCount: number
  /** Non-null when this PR is base-branch-chained to another open PR. */
  stack: StackMembership | null
}

export interface DashboardData {
  viewerLogin: string
  fetchedAt: string
  prs: Pr[]
  /** Set when the last refresh attempt failed; the data shown is the last good snapshot. */
  error: string | null
}
