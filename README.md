<img width="1918" height="1035" alt="Screenshot 2026-09-22 at 16 34 17" src="https://github.com/user-attachments/assets/ad94e277-ab9f-4cbd-9872-6c6713bcdd85" />
<img width="1919" height="1035" alt="Screenshot 2026-09-22 at 16 33 42" src="https://github.com/user-attachments/assets/39de2d3a-4ceb-4130-8615-7ff537be3027" />
# PR Dashboard

A personal dashboard for tracking your own open GitHub PRs: which stack
they're in, who's reviewed them, which review comments you haven't replied
to, and whether they're stale and need a rebase.


## Requirements

- `gh` CLI, authenticated (`gh auth status`)
- `bun`

## Usage

```bash
bun install
bun run dev
```

Open the printed local URL. Data refreshes automatically every 60s, or click
**Refresh** for an immediate update. All GitHub data is fetched server-side
(in a Vite dev-server middleware) by shelling out to `gh`, so nothing beyond
the local dev server is required.

## How it works

- `server/fetchDashboard.ts` discovers your open PRs (`gh search prs
  --author=@me`) across every repo you have access to, then fetches full
  detail per PR via `gh api graphql`.
- Stacks are detected by chaining `baseRefName` -> `headRefName` within a
  repo — no manual tagging needed.
- A review thread counts as "unaddressed" if it's unresolved on GitHub *and*
  your reply isn't the last comment in it.
- Staleness ("Needs rebase" / "Conflicts") comes from GitHub's own
  `mergeStateStatus`.
