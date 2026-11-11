# GLUE Index

**G**ritty, **L**ow-**U**sage, **E**rrorless. An NBA index for the players who win possessions and avoid
mistakes without needing the ball: seven credits, seven debits, each z-scored and weighted.

The site shows the top glue guys of every night, season leaderboards back to 2005-06, career totals
and a page per player. The full method is on the site's `/method` page and the weights live in
[`lib/formula.ts`](lib/formula.ts).

## How it works

```
pbpstats.com ──▶ scripts/fetch.ts ──▶ data/raw/        (committed)
                                         │
                 scripts/build-data.ts ◀─┘
                         │
                         ├──▶ data/site/     scored JSON the pages are built from
                         └──▶ public/data/   the same boards as a public JSON API
                                  │
                              next build ──▶ static site on Vercel
```

- **Nightly.** `.github/workflows/nightly.yml` runs at 09:15 UTC. It pulls every game date not yet
  stored, re-pulls the two most recent nights for stat corrections, refreshes the current season's
  totals and commits `data/raw`. The push triggers a Vercel build, which scores everything again.
- **Raw data is the only thing stored.** Scores are always recomputed from it, so a formula change
  needs no re-fetch.
- **Single games** are scored against the season to date, not the night's slate. See `/method`.

## Commands

| Command | What it does |
| --- | --- |
| `pnpm dev` | Run the site locally (run `pnpm data` first) |
| `pnpm data` | Score `data/raw` into `data/site` and `public/data` |
| `pnpm build` | `pnpm data`, then build the static site |
| `pnpm nightly` | What the cron job runs: pull new nights and the current season |
| `node scripts/fetch.ts nights 2025-26` | Backfill every night of a season. Resumable |
| `node scripts/fetch.ts seasons 2005-06 2026-27` | Refresh season totals for a range |

Requires Node 24 or later, which runs the TypeScript scripts directly.

## JSON

- `/data/latest.json`: the most recent night
- `/data/glue-YYYY-MM-DD.json`: any scored night
- `/data/season-YYYY-YY.json`: a season leaderboard

Data from [pbpstats.com](https://www.pbpstats.com). Not affiliated with the NBA.
