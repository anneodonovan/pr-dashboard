import { ghGraphQL, ghJson, getViewerLogin } from './github'
import { buildStacks } from './buildStacks'
import type { CiStatus, DashboardData, Pr, ReviewState, Reviewer, Staleness, UnaddressedThread } from './types'

interface SearchResultItem {
  repository: { nameWithOwner: string }
  number: number
}

const PR_DETAIL_QUERY = `
  query($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        title
        url
        isDraft
        headRefName
        baseRefName
        mergeStateStatus
        reviewDecision
        updatedAt
        latestReviews(first: 30) {
          nodes { author { login } state submittedAt }
        }
        reviewRequests(first: 30) {
          nodes {
            requestedReviewer {
              __typename
              ... on User { login }
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
        commits(last: 1) {
          nodes { commit { statusCheckRollup { state } } }
        }
      }
    }
  }
`

interface RawReviewThread {
  isResolved: boolean
  comments: { nodes: Array<{ author: { login: string } | null; body: string; url: string }> }
}

interface RawPrDetail {
  repository: {
    pullRequest: {
      title: string
      url: string
      isDraft: boolean
      headRefName: string
      baseRefName: string
      mergeStateStatus: string
      reviewDecision: string | null
      updatedAt: string
      latestReviews: { nodes: Array<{ author: { login: string } | null; state: string; submittedAt: string }> }
      reviewRequests: { nodes: Array<{ requestedReviewer: { login?: string; name?: string } | null }> }
      reviewThreads: { nodes: RawReviewThread[] }
      commits: { nodes: Array<{ commit: { statusCheckRollup: { state: string } | null } }> }
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

type RawPr = NonNullable<NonNullable<RawPrDetail['repository']>['pullRequest']>

function deriveReviewers(detail: RawPr): Reviewer[] {
  const byLogin = new Map<string, Reviewer>()

  for (const req of detail.reviewRequests.nodes) {
    const login = req.requestedReviewer?.login ?? req.requestedReviewer?.name
    if (!login) continue
    byLogin.set(login, { login, state: 'pending', submittedAt: null })
  }

  for (const review of detail.latestReviews.nodes) {
    const login = review.author?.login
    const state = mapReviewState(review.state)
    if (!login || !state) continue
    byLogin.set(login, { login, state, submittedAt: review.submittedAt })
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
      preview: last.body.slice(0, 140),
      author: last.author?.login ?? 'unknown',
      url: last.url,
    })
  }
  return unaddressed
}

async function fetchPrDetail(nameWithOwner: string, number: number, viewerLogin: string): Promise<Pr> {
  const [owner, repo] = nameWithOwner.split('/')
  const data = await ghGraphQL<RawPrDetail>(PR_DETAIL_QUERY, { owner, repo, number })
  const pr = data.repository?.pullRequest
  if (!pr) throw new Error(`${nameWithOwner}#${number} not found`)

  return {
    repo: nameWithOwner,
    number,
    title: pr.title,
    url: pr.url,
    isDraft: pr.isDraft,
    updatedAt: pr.updatedAt,
    headRefName: pr.headRefName,
    baseRefName: pr.baseRefName,
    ciStatus: mapCiStatus(pr.commits.nodes[0]?.commit.statusCheckRollup?.state),
    staleness: mapStaleness(pr.mergeStateStatus),
    reviewDecision: pr.reviewDecision,
    reviewers: deriveReviewers(pr),
    unaddressedThreads: deriveUnaddressedThreads(pr.reviewThreads.nodes, viewerLogin),
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
