// Scores everything in data/raw and writes the JSON the site is built from.
//
//   data/site/**          read by the Next.js build (not committed)
//   public/data/**        the same nightly and season boards, served as a public JSON API
import { rm } from "node:fs/promises";
import path from "node:path";
import {
  BASELINE_MIN_GAMES,
  COMPONENTS,
  GAME_MIN_SECONDS,
  N_COMPONENTS,
  SEASON_GAMES,
  SEASON_MIN_MINUTES,
} from "../lib/formula.ts";
import type {
  CareerRow,
  Line,
  Night,
  PlayerFile,
  PlayerGame,
  PlayerSeason,
  SeasonBoard,
  SiteIndex,
} from "../lib/types.ts";
import { RAW, ROOT, listDirs, listJson, readJson, writeJson } from "./lib/pbp.ts";
import type { RawNight, RawPlayer, RawSeason } from "./lib/pbp.ts";
import { nameKey, salaryPath } from "./lib/salaries.ts";
import type { RawSalaries } from "./lib/salaries.ts";
import { existsSync } from "node:fs";

const SITE = path.join(ROOT, "data", "site");
const PUBLIC = path.join(ROOT, "public", "data");
const WEIGHTS = COMPONENTS.map((c) => c.weight);
const OFD = COMPONENTS.findIndex((c) => c.key === "ofd");
const LBFD = COMPONENTS.findIndex((c) => c.key === "lbfd");

const round = (x: number, places: number) => Math.round(x * 10 ** places) / 10 ** places;

type Dist = { mean: number[]; sd: number[] };

/** Mean and sample standard deviation per component, from running sums. */
function distFromSums(n: number, sum: number[], sumSq: number[]): Dist {
  const mean = sum.map((s) => s / n);
  const sd = sumSq.map((sq, i) => (n > 1 ? Math.sqrt(Math.max(0, (sq - n * mean[i] ** 2) / (n - 1))) : 0));
  return { mean, sd };
}

function dist(pool: number[][]): Dist {
  const sum = new Array(N_COMPONENTS).fill(0);
  const sumSq = new Array(N_COMPONENTS).fill(0);
  for (const v of pool) {
    for (let i = 0; i < N_COMPONENTS; i++) {
      sum[i] += v[i];
      sumSq[i] += v[i] ** 2;
    }
  }
  return distFromSums(pool.length, sum, sumSq);
}

function score(v: number[], d: Dist): { glue: number; c: number[] } {
  const c = v.map((x, i) => (d.sd[i] > 0 ? (WEIGHTS[i] * (x - d.mean[i])) / d.sd[i] : 0));
  return { glue: round(c.reduce((a, b) => a + b, 0), 2), c: c.map((x) => round(x, 3)) };
}

function toLines(players: RawPlayer[], d: Dist): Line[] {
  const lines = players.map((p) => ({
    rank: 0,
    id: p.id,
    name: p.name,
    team: p.team,
    min: round(p.sec / 60, 1),
    gp: p.gp,
    ...score(p.v, d),
    v: p.v,
    pts: p.pts,
    reb: p.reb,
    ast: p.ast,
  }));
  lines.sort((a, b) => b.glue - a.glue);
  lines.forEach((l, i) => (l.rank = i + 1));
  return lines;
}

// ---------------------------------------------------------------- seasons

const nightSeasonsAsc = await listDirs(path.join(RAW, "nights"));
const nightDates = new Map<string, string[]>();
for (const season of nightSeasonsAsc) {
  const dates = (await listJson(path.join(RAW, "nights", season))).map((f) => f.replace(".json", ""));
  nightDates.set(season, dates);
}

const seasonFiles = await listJson(path.join(RAW, "seasons"));
const boards: SeasonBoard[] = [];
for (const file of seasonFiles) {
  const raw = await readJson<RawSeason>(path.join(RAW, "seasons", file));
  const teamGames = Math.min(SEASON_GAMES, Math.max(...raw.players.map((p) => p.gp)));
  const minMinutes = Math.round((SEASON_MIN_MINUTES * teamGames) / SEASON_GAMES);
  const qualified = raw.players.filter((p) => p.sec / 60 >= minMinutes);

  // Foul-drawn tracking only exists in later play-by-play. Skip seasons without it.
  const share = (i: number) => qualified.filter((p) => p.v[i] > 0).length / Math.max(1, qualified.length);
  if (share(OFD) < 0.5 || share(LBFD) < 0.3) {
    console.log(`${raw.season}: skipped, fouls drawn not tracked (${round(share(OFD), 2)}, ${round(share(LBFD), 2)})`);
    continue;
  }

  const d = dist(qualified.map((p) => p.v));
  const dates = nightDates.get(raw.season) ?? [];
  const asOf = dates.at(-1) ?? null;
  const isLatest = file === seasonFiles.at(-1);
  const lines = toLines(qualified, d);
  let salariesAsOf: string | null = null;
  if (existsSync(salaryPath(raw.season))) {
    const salaries = await readJson<RawSalaries>(salaryPath(raw.season));
    const byName = new Map(salaries.players.map((p) => [nameKey(p.name), p]));
    salariesAsOf = salaries.fetchedAt.slice(0, 10);
    let missing = 0;
    for (const line of lines) {
      const contract = byName.get(nameKey(line.name));
      if (contract) Object.assign(line, { salary: contract.salary, aav: contract.aav });
      else missing++;
    }
    console.log(`${raw.season}: ${lines.length - missing} of ${lines.length} qualified players matched to a contract`);
  }
  boards.push({
    season: raw.season,
    inProgress: isLatest && teamGames < SEASON_GAMES,
    asOf,
    teamGames,
    minMinutes,
    mean: d.mean.map((x) => round(x, 3)),
    sd: d.sd.map((x) => round(x, 3)),
    salariesAsOf,
    players: lines,
  });
}
boards.sort((a, b) => b.season.localeCompare(a.season));
console.log(`seasons scored: ${boards.length} (${boards.at(-1)?.season} to ${boards[0]?.season})`);

// ---------------------------------------------------------------- nights

type PoolGame = { date: string; season: string; v: number[] };
const rawNights: RawNight[] = [];
for (const season of nightSeasonsAsc) {
  for (const date of nightDates.get(season)!) {
    rawNights.push(await readJson<RawNight>(path.join(RAW, "nights", season, `${date}.json`)));
  }
}
rawNights.sort((a, b) => a.date.localeCompare(b.date));

// Every qualified player-game in date order, with prefix sums so any contiguous
// window's mean and deviation is O(components).
const pool: PoolGame[] = [];
const nightRange = new Map<string, { start: number; end: number }>();
for (const night of rawNights) {
  const start = pool.length;
  for (const p of night.players) {
    if (p.sec >= GAME_MIN_SECONDS) pool.push({ date: night.date, season: night.season, v: p.v });
  }
  nightRange.set(night.date, { start, end: pool.length });
}
const prefix: number[][] = [new Array(N_COMPONENTS * 2).fill(0)];
for (const g of pool) {
  const prev = prefix[prefix.length - 1];
  const next = prev.slice();
  for (let i = 0; i < N_COMPONENTS; i++) {
    next[i] += g.v[i];
    next[N_COMPONENTS + i] += g.v[i] ** 2;
  }
  prefix.push(next);
}
function windowDist(from: number, to: number): Dist {
  const a = prefix[from];
  const b = prefix[to];
  const diff = b.map((x, i) => x - a[i]);
  return distFromSums(to - from, diff.slice(0, N_COMPONENTS), diff.slice(N_COMPONENTS));
}

const seasonStart = new Map<string, number>();
pool.forEach((g, i) => {
  if (!seasonStart.has(g.season)) seasonStart.set(g.season, i);
});

const nights: Night[] = [];
for (const raw of rawNights) {
  const range = nightRange.get(raw.date)!;
  // Season to date, including this night. Early in a season that is too thin,
  // so top it up with the most recent games before it, then games after it.
  let from = seasonStart.get(raw.season) ?? range.start;
  let to = range.end;
  const short = () => BASELINE_MIN_GAMES - (to - from);
  if (short() > 0) from = Math.max(0, from - short());
  if (short() > 0) to = Math.min(pool.length, to + short());
  const d = windowDist(from, to);

  const sides = new Map<string, { opp: string; home: boolean }>();
  for (const g of raw.games) {
    sides.set(g.home, { opp: g.away, home: true });
    sides.set(g.away, { opp: g.home, home: false });
  }
  const players = toLines(
    raw.players.filter((p) => p.sec >= GAME_MIN_SECONDS),
    d,
  ).map((l) => ({ ...l, ...(sides.get(l.team) ?? { opp: "", home: true }) }));

  nights.push({
    date: raw.date,
    season: raw.season,
    games: raw.games,
    baseline: {
      games: to - from,
      from: pool[from].date,
      to: pool[to - 1].date,
      mean: d.mean.map((x) => round(x, 3)),
      sd: d.sd.map((x) => round(x, 3)),
    },
    players,
  });
}
console.log(`nights scored: ${nights.length}, qualified player-games: ${pool.length}`);

// ---------------------------------------------------------------- players and careers

const files = new Map<string, PlayerFile>();
const fileFor = (id: string, name: string) => {
  let f = files.get(id);
  if (!f) files.set(id, (f = { id, name, career: null, seasons: [], games: [] }));
  f.name = name;
  return f;
};

for (const board of [...boards].reverse()) {
  for (const line of board.players) {
    const season: PlayerSeason = { ...line, season: board.season, of: board.players.length, inProgress: board.inProgress };
    fileFor(line.id, line.name).seasons.push(season);
  }
}
for (const night of nights) {
  for (const l of night.players) {
    const game: PlayerGame = {
      date: night.date,
      season: night.season,
      team: l.team,
      opp: l.opp ?? "",
      home: l.home ?? true,
      min: l.min,
      glue: l.glue,
      rank: l.rank,
      of: night.players.length,
      v: l.v,
    };
    fileFor(l.id, l.name).games.push(game);
  }
}

// Career GLUE is the sum of completed, qualified season scores.
const careers: CareerRow[] = [];
for (const f of files.values()) {
  const done = f.seasons.filter((s) => !s.inProgress);
  if (done.length === 0) continue;
  const glue = round(done.reduce((a, s) => a + s.glue, 0), 2);
  const best = done.reduce((a, s) => (s.glue > a.glue ? s : a));
  const row: CareerRow = {
    rank: 0,
    id: f.id,
    name: f.name,
    glue,
    seasons: done.length,
    first: done[0].season,
    last: done.at(-1)!.season,
    avg: round(glue / done.length, 2),
    best: { season: best.season, glue: best.glue },
    teams: [...new Set(done.map((s) => s.team))],
  };
  careers.push(row);
  f.career = row;
}
careers.sort((a, b) => b.glue - a.glue);
careers.forEach((c, i) => (c.rank = i + 1));

// ---------------------------------------------------------------- write

await rm(SITE, { recursive: true, force: true });
await rm(PUBLIC, { recursive: true, force: true });

const doneBoards = boards.filter((b) => !b.inProgress);
const index: SiteIndex = {
  generatedAt: new Date().toISOString(),
  latest: nights.at(-1)?.date ?? "",
  seasons: boards.map((b) => b.season),
  valueSeasons: boards.filter((b) => b.salariesAsOf).map((b) => b.season),
  nightSeasons: [...nightSeasonsAsc].reverse(),
  nights: nights.map((n) => n.date),
  playerIds: [...files.keys()],
  names: Object.fromEntries([...files.values()].map((f) => [f.id, f.name])),
  careerSeasons: { first: doneBoards.at(-1)?.season ?? "", last: doneBoards[0]?.season ?? "" },
};

await writeJson(path.join(SITE, "index.json"), index);
await writeJson(path.join(SITE, "careers.json"), careers);
for (const b of boards) {
  await writeJson(path.join(SITE, "seasons", `${b.season}.json`), b);
  await writeJson(path.join(PUBLIC, `season-${b.season}.json`), b);
}
for (const n of nights) {
  await writeJson(path.join(SITE, "nights", `${n.date}.json`), n);
  await writeJson(path.join(PUBLIC, `glue-${n.date}.json`), n);
}
if (nights.length) await writeJson(path.join(PUBLIC, "latest.json"), nights.at(-1));
for (const f of files.values()) await writeJson(path.join(SITE, "players", `${f.id}.json`), f);

console.log(`players: ${files.size}, careers: ${careers.length}, latest night: ${index.latest}`);
