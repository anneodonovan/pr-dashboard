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
