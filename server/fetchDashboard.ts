import { ghGraphQL, ghJson, getViewerLogin } from './github'
import { annotateStacks } from './buildStacks'
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

// How many PRs' worth of (fairly expensive, deeply-nested) detail to pack
// into a single aliased GraphQL request. Keeps per-request node count well
// under GitHub's complexity limits while cutting request count roughly
// tenfold versus one request per PR.
const BATCH_SIZE = 10

// How many of those batched requests to have in flight at once. Bounds the
// burst of concurrent requests so a large number of open PRs doesn't trip
// GitHub's (primary or secondary) rate limiting.
const BATCH_CONCURRENCY = 3

const PR_DETAIL_FIELDS = `
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
`

interface PrRef {
  nameWithOwner: string
  owner: string
  repo: string
  number: number
}

/** Builds one GraphQL request covering several PRs via aliased fields, e.g. `pr0: repository(...) { ... } pr1: repository(...) { ... }`. */
function buildBatchQuery(refs: PrRef[]): { query: string; variables: Record<string, string | number> } {
  const paramDecls: string[] = []
  const variables: Record<string, string | number> = {}
  const aliasFields = refs.map((ref, i) => {
    paramDecls.push(`$owner${i}: String!`, `$repo${i}: String!`, `$number${i}: Int!`)
    variables[`owner${i}`] = ref.owner
    variables[`repo${i}`] = ref.repo
    variables[`number${i}`] = ref.number
    return `pr${i}: repository(owner: $owner${i}, name: $repo${i}) { pullRequest(number: $number${i}) { ${PR_DETAIL_FIELDS} } }`
  })
  const query = `query(${paramDecls.join(', ')}) {\n${aliasFields.join('\n')}\n}`
  return { query, variables }
}

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < items.length; i += size) chunks.push(items.slice(i, i + size))
  return chunks
}

/** Runs `fn` over `items` with at most `limit` calls in flight at once. */
async function mapWithConcurrency<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let nextIndex = 0
  async function worker() {
    while (nextIndex < items.length) {
      const i = nextIndex++
      results[i] = await fn(items[i])
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker))
  return results
}

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

interface RawPr {
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
}

/** Response shape for a batched request built by `buildBatchQuery`: one aliased `repository` field per PR. */
type BatchedPrDetailResponse = Record<string, { pullRequest: RawPr | null } | null>

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
  reviewDecision: string | null
  mergeStateStatus: string
  hasUnaddressed: boolean
  ciStatus: CiStatus
}): PrStatus {
  if (pr.isDraft) return 'draft'
  if (pr.reviewDecision === 'CHANGES_REQUESTED') return 'changes-requested'
  // Unaddressed feedback acts like an informal changes-requested, even when
  // no one has formally blocked the PR through GitHub's review decision.
  if (pr.hasUnaddressed) return 'changes-requested'
  if (pr.reviewDecision === 'APPROVED') {
    const ciBlocking = pr.ciStatus === 'failure' || pr.ciStatus === 'pending'
    return pr.mergeStateStatus === 'CLEAN' && !ciBlocking ? 'ready-to-merge' : 'approved'
  }
  return 'waiting-for-approval'
}

function mapPrDetail(nameWithOwner: string, number: number, viewerLogin: string, pr: RawPr): Pr {
  const reviewers = deriveReviewers(pr)
  const rollup = pr.commits.nodes[0]?.commit.statusCheckRollup
  const ciStatus = mapCiStatus(rollup?.state)
  const unaddressedGeneralComment = deriveUnaddressedGeneralComment(pr.comments.nodes, viewerLogin)
  const unaddressedThreads = [
    ...deriveUnaddressedThreads(pr.reviewThreads.nodes, viewerLogin),
    ...(unaddressedGeneralComment ? [unaddressedGeneralComment] : []),
  ]

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
    status: deriveStatus({
      isDraft: pr.isDraft,
      reviewDecision: pr.reviewDecision,
      mergeStateStatus: pr.mergeStateStatus,
      hasUnaddressed: unaddressedThreads.length > 0,
      ciStatus,
    }),
    ciStatus,
    checks: mapChecks(rollup?.contexts.nodes ?? []),
    staleness: mapStaleness(pr.mergeStateStatus),
    reviewDecision: pr.reviewDecision,
    reviewers,
    unaddressedThreads,
    additions: pr.additions,
    deletions: pr.deletions,
    changedFiles: pr.changedFiles,
    commitsCount: pr.commits.totalCount,
    commentsCount: pr.comments.totalCount,
    stack: null,
  }
}

/** A PR isn't truly ready to merge while it's stacked behind another open PR — it depends on that one merging first, however individually approved and clean it is. */
function downgradeBlockedStackMembers(prs: Pr[]): void {
  for (const pr of prs) {
    if (pr.status === 'ready-to-merge' && pr.stack && pr.stack.position > 1) {
      pr.status = 'approved'
    }
  }
}

async function fetchPrDetails(refs: PrRef[], viewerLogin: string): Promise<Pr[]> {
  const batches = chunk(refs, BATCH_SIZE)
  const batchResults = await mapWithConcurrency(batches, BATCH_CONCURRENCY, async (batchRefs) => {
    const { query, variables } = buildBatchQuery(batchRefs)
    const data = await ghGraphQL<BatchedPrDetailResponse>(query, variables)
    return batchRefs.map((ref, i) => {
      const pr = data[`pr${i}`]?.pullRequest
      if (!pr) throw new Error(`${ref.nameWithOwner}#${ref.number} not found`)
      return mapPrDetail(ref.nameWithOwner, ref.number, viewerLogin, pr)
    })
  })
  return batchResults.flat()
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

  const refs: PrRef[] = results.map((r) => {
    const [owner, repo] = r.repository.nameWithOwner.split('/')
    return { nameWithOwner: r.repository.nameWithOwner, owner, repo, number: r.number }
  })

  const prs = await fetchPrDetails(refs, viewerLogin)

  annotateStacks(prs)
  downgradeBlockedStackMembers(prs)

  return {
    viewerLogin,
    fetchedAt: new Date().toISOString(),
    prs,
    error: null,
  }
}
