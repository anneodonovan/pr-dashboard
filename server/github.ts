import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// gh's own output can exceed the default 1MB stdout buffer for large GraphQL
// responses (many review threads / comments across several PRs).
const MAX_BUFFER = 32 * 1024 * 1024

const MAX_RETRIES = 3
const BASE_RETRY_DELAY_MS = 1000

function isRateLimitError(message: string): boolean {
  return /rate limit|abuse detection/i.test(message)
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// GitHub's rate limiting (primary or secondary/abuse-detection) is usually
// transient. Retrying with backoff lets a single burst recover on its own
// instead of surfacing as a failed refresh.
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      if (attempt >= MAX_RETRIES || !isRateLimitError(message)) throw err
      const delay = BASE_RETRY_DELAY_MS * 2 ** attempt + Math.random() * 250
      await sleep(delay)
    }
  }
}

async function runGh(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('gh', args, { maxBuffer: MAX_BUFFER })
  return stdout
}

export async function ghJson<T>(args: string[]): Promise<T> {
  return withRetry(async () => {
    const stdout = await runGh(args)
    return JSON.parse(stdout) as T
  })
}

export async function ghGraphQL<T>(query: string, variables: Record<string, string | number>): Promise<T> {
  return withRetry(async () => {
    const args = ['api', 'graphql', '-f', `query=${query}`]
    for (const [key, value] of Object.entries(variables)) {
      const flag = typeof value === 'number' ? '-F' : '-f'
      args.push(flag, `${key}=${value}`)
    }
    const stdout = await runGh(args)
    const parsed = JSON.parse(stdout) as { data: T; errors?: Array<{ message: string }> }
    if (parsed.errors?.length) {
      throw new Error(parsed.errors.map((e) => e.message).join('; '))
    }
    return parsed.data
  })
}

let viewerLoginCache: string | null = null

export async function getViewerLogin(): Promise<string> {
  if (viewerLoginCache) return viewerLoginCache
  const stdout = await runGh(['api', 'user', '--jq', '.login'])
  viewerLoginCache = stdout.trim()
  return viewerLoginCache
}
