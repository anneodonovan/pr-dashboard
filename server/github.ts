import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

// gh's own output can exceed the default 1MB stdout buffer for large GraphQL
// responses (many review threads / comments across several PRs).
const MAX_BUFFER = 32 * 1024 * 1024

async function runGh(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('gh', args, { maxBuffer: MAX_BUFFER })
  return stdout
}

export async function ghJson<T>(args: string[]): Promise<T> {
  const stdout = await runGh(args)
  return JSON.parse(stdout) as T
}

export async function ghGraphQL<T>(query: string, variables: Record<string, string | number>): Promise<T> {
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
}

let viewerLoginCache: string | null = null

export async function getViewerLogin(): Promise<string> {
  if (viewerLoginCache) return viewerLoginCache
  const stdout = await runGh(['api', 'user', '--jq', '.login'])
  viewerLoginCache = stdout.trim()
  return viewerLoginCache
}
