import { ghGraphQL, ghJson, getViewerLogin } from './github'
import { buildStacks } from './buildStacks'
import type {
  CheckItem,
  CiStatus,
  DashboardData,
  Pr,
  PrStatus,
  ReviewState,
  Reviewer,
  Staleness,
  UnaddressedThread,
} from './types'

interface SearchResultItem {
  repository: { nameWithOwner: string }
  number: number
}

const PR_DETAIL_QUERY = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        title
        body
        url
        isDraft
        createdAt
        headRefName
        baseRefName
        mergeStateStatus
        reviewDecision
        updatedAt
        additions
        deletions
        changedFiles
        commits(last: 1) {
          totalCount
          nodes {
            commit {
              statusCheckRollup {
                state
                contexts(first: 30) {
                  nodes {
                    __typename
                    ... on CheckRun { name conclusion status detailsUrl }
                    ... on StatusContext { context state targetUrl }
                  }
                }
              }
            }
          }
        }
        comments(first: 50) {
          totalCount
          nodes { author { login __typename } body url }
        }
        latestReviews(first: 30) {
          nodes { author { login ... on User { name } } state submittedAt }
        }
        reviewRequests(first: 30) {
          nodes {
            requestedReviewer {
              __typename
              ... on User { login name }
              ... on Team { name }
            }
          }
        }
        reviewThreads(first: 50) {
          nodes {
            isResolved
            comments(first: 50) {
              nodes { author { login } body url }
            }
          }
        }
      }
    }
  }
`

interface RawReviewThread {
  isResolved: boolean
  comments: { nodes: Array<{ author: { login: string } | null; body: string; url: string }> }
}

interface RawCheckContext {
  __typename: 'CheckRun' | 'StatusContext'
  name?: string
  conclusion?: string | null
  status?: string
  detailsUrl?: string
  context?: string
  state?: string
  targetUrl?: string
}

interface RawPrDetail {
  repository: {
    pullRequest: {
      title: string
      body: string
      url: string
      isDraft: boolean
      createdAt: string
      headRefName: string
      baseRefName: string
      mergeStateStatus: string
      reviewDecision: string | null
      updatedAt: string
      additions: number
      deletions: number
      changedFiles: number
      commits: {
        totalCount: number
        nodes: Array<{ commit: { statusCheckRollup: { state: string; contexts: { nodes: RawCheckContext[] } } | null } }>
      }
      comments: { totalCount: number; nodes: Array<{ author: { login: string; __typename: string } | null; body: string; url: string }> }
      latestReviews: { nodes: Array<{ author: { login: string; name?: string | null } | null; state: string; submittedAt: string }> }
      reviewRequests: { nodes: Array<{ requestedReviewer: { login?: string; name?: string | null } | null }> }
      reviewThreads: { nodes: RawReviewThread[] }
    } | null
  } | null
}

function mapStaleness(mergeStateStatus: string): Staleness {
  if (mergeStateStatus === 'BEHIND') return 'needs-rebase'
  if (mergeStateStatus === 'DIRTY') return 'conflicts'
  return 'up-to-date'
}

function mapCiStatus(state: string | undefined): CiStatus {
  if (state === 'SUCCESS') return 'success'
  if (state === 'FAILURE' || state === 'ERROR') return 'failure'
  if (state === 'PENDING' || state === 'EXPECTED') return 'pending'
  return 'unknown'
}

function mapReviewState(state: string): ReviewState | null {
  switch (state) {
    case 'APPROVED':
      return 'approved'
    case 'CHANGES_REQUESTED':
      return 'changes-requested'
    case 'COMMENTED':
      return 'commented'
    default:
      // DISMISSED / PENDING (unsubmitted draft review) carry no useful signal.
      return null
  }
}

function mapChecks(contexts: RawCheckContext[]): CheckItem[] {
  return contexts.map((ctx) => {
    if (ctx.__typename === 'CheckRun') {
      return { name: ctx.name ?? 'check', status: (ctx.conclusion ?? ctx.status ?? 'pending').toLowerCase(), url: ctx.detailsUrl ?? null }
    }
    return { name: ctx.context ?? 'status', status: (ctx.state ?? 'pending').toLowerCase(), url: ctx.targetUrl ?? null }
  })
}

type RawPr = NonNullable<NonNullable<RawPrDetail['repository']>['pullRequest']>

function deriveReviewers(detail: RawPr): Reviewer[] {
  const byLogin = new Map<string, Reviewer>()

  for (const req of detail.reviewRequests.nodes) {
    const login = req.requestedReviewer?.login ?? req.requestedReviewer?.name
    if (!login) continue
    byLogin.set(login, { login, name: req.requestedReviewer?.name ?? null, state: 'pending', submittedAt: null })
  }

  for (const review of detail.latestReviews.nodes) {
    const login = review.author?.login
    const state = mapReviewState(review.state)
    if (!login || !state) continue
    byLogin.set(login, { login, name: review.author?.name ?? null, state, submittedAt: review.submittedAt })
  }

  return Array.from(byLogin.values())
}

function deriveUnaddressedThreads(threads: RawReviewThread[], viewerLogin: string): UnaddressedThread[] {
  const unaddressed: UnaddressedThread[] = []
  for (const thread of threads) {
    if (thread.isResolved) continue
    const comments = thread.comments.nodes
    if (comments.length === 0) continue
    const last = comments[comments.length - 1]
    if (last.author?.login === viewerLogin) continue
    unaddressed.push({
      body: last.body,
      author: last.author?.login ?? 'unknown',
      url: last.url,
    })
  }
  return unaddressed
}

/**
 * Some reviewers post their overall review as a plain PR comment rather than
 * (or in addition to) inline review-thread comments. There's no "resolved"
 * concept for these, so the equivalent signal is: the most recent non-bot
 * comment in the conversation isn't from the viewer.
 */
function deriveUnaddressedGeneralComment(
  comments: Array<{ author: { login: string; __typename: string } | null; body: string; url: string }>,
  viewerLogin: string,
): UnaddressedThread | null {
  for (let i = comments.length - 1; i >= 0; i--) {
    const comment = comments[i]
    if (comment.author?.__typename === 'Bot') continue
    if (!comment.author) return null
    if (comment.author.login === viewerLogin) return null
    return { body: comment.body, author: comment.author.login, url: comment.url }
  }
  return null
}

function deriveStatus(pr: {
  isDraft: boolean
  reviewers: Reviewer[]
  reviewDecision: string | null
  mergeStateStatus: string
}): PrStatus {
  if (pr.isDraft) return 'draft'
  if (pr.reviewers.length === 0) return 'no-reviewer'
  if (pr.reviewDecision === 'CHANGES_REQUESTED') return 'changes-requested'
  if (pr.reviewDecision === 'APPROVED') {
    return pr.mergeStateStatus === 'CLEAN' ? 'ready-to-merge' : 'approved'
  }
  return 'waiting-for-approval'
}

async function fetchPrDetail(nameWithOwner: string, number: number, viewerLogin: string): Promise<Pr> {
  const [owner, repo] = nameWithOwner.split('/')
  const data = await ghGraphQL<RawPrDetail>(PR_DETAIL_QUERY, { owner, repo, number })
  const pr = data.repository?.pullRequest
  if (!pr) throw new Error(`${nameWithOwner}#${number} not found`)

  const reviewers = deriveReviewers(pr)
  const rollup = pr.commits.nodes[0]?.commit.statusCheckRollup
  const unaddressedGeneralComment = deriveUnaddressedGeneralComment(pr.comments.nodes, viewerLogin)

  return {
    repo: nameWithOwner,
    number,
    title: pr.title,
    body: pr.body,
    url: pr.url,
    isDraft: pr.isDraft,
    createdAt: pr.createdAt,
    updatedAt: pr.updatedAt,
    headRefName: pr.headRefName,
    baseRefName: pr.baseRefName,
    status: deriveStatus({ isDraft: pr.isDraft, reviewers, reviewDecision: pr.reviewDecision, mergeStateStatus: pr.mergeStateStatus }),
    ciStatus: mapCiStatus(rollup?.state),
    checks: mapChecks(rollup?.contexts.nodes ?? []),
    staleness: mapStaleness(pr.mergeStateStatus),
    reviewDecision: pr.reviewDecision,
    reviewers,
    unaddressedThreads: [
      ...deriveUnaddressedThreads(pr.reviewThreads.nodes, viewerLogin),
      ...(unaddressedGeneralComment ? [unaddressedGeneralComment] : []),
    ],
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changedFiles,
    commitsCount: pr.commits.totalCount,
    commentsCount: pr.comments.totalCount,
  }
}

export async function fetchDashboard(): Promise<DashboardData> {
  const viewerLogin = await getViewerLogin()

  const results = await ghJson<SearchResultItem[]>([
    'search',
    'prs',
    '--author=@me',
    '--state=open',
    '--json',
    'repository,number',
    '--limit',
    '100',
  ])

  const prs = await Promise.all(
    results.map((r) => fetchPrDetail(r.repository.nameWithOwner, r.number, viewerLogin)),
  )

  const { stacks, standalone } = buildStacks(prs)

  return {
    viewerLogin,
    fetchedAt: new Date().toISOString(),
    stacks,
    standalone,
    error: null,
  }
}
