// Thin pbpstats.com API client plus raw-file helpers.
import { mkdir, readFile, writeFile, readdir } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { COMPONENTS } from "../../lib/formula.ts";

const API = "https://api.pbpstats.com";
export const ROOT = path.resolve(import.meta.dirname, "..", "..");
export const RAW = path.join(ROOT, "data", "raw");
export const SEASON_TYPE = "Regular Season";

export type Row = Record<string, string | number | null | undefined>;

export type RawPlayer = {
  id: string;
  name: string;
  team: string;
  sec: number;
  gp: number;
  /** Component values in COMPONENTS order. */
  v: number[];
  pts: number;
  reb: number;
  ast: number;
};

export type RawGame = { id: string; home: string; away: string; homePts: number; awayPts: number };
export type RawNight = { date: string; season: string; games: RawGame[]; players: RawPlayer[] };
export type RawSeason = { season: string; fetchedAt: string; players: RawPlayer[] };

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function api<T>(endpoint: string, params: Record<string, string>): Promise<T> {
  const url = `${API}/${endpoint}?${new URLSearchParams(params)}`;
  let lastError: unknown;
  for (let attempt = 0; attempt < 6; attempt++) {
    if (attempt > 0) await sleep(2000 * 2 ** (attempt - 1));
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": "Mozilla/5.0 (compatible; glue-index-pipeline)" },
        signal: AbortSignal.timeout(120_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return (await res.json()) as T;
    } catch (err) {
      lastError = err;
      console.warn(`  retry ${attempt + 1} for ${endpoint} ${JSON.stringify(params)}: ${err}`);
    }
  }
  throw new Error(`pbpstats request failed: ${url}: ${lastError}`);
}

const num = (row: Row, key: string) => Number(row[key] ?? 0) || 0;

function componentValues(row: Row): number[] {
  const values: Record<string, number> = {
    stl: num(row, "Steals"),
    rblk: num(row, "RecoveredBlocks"),
    ofd: num(row, "Offensive Fouls Drawn"),
    oreb: num(row, "OffRebounds"),
    fg3m: num(row, "FG3M"),
    ftm: num(row, "FtPoints"),
    lbfd: num(row, "Loose Ball Fouls Drawn"),
    lto: num(row, "LiveBallTurnovers"),
    usg: Math.round(num(row, "Usage") * 100) / 100,
    badf: num(row, "ShootingFouls") + num(row, "NonShootingPenaltyNonTakeFouls"),
    ofc: num(row, "Offensive Fouls"),
    mft: num(row, "FTA") - num(row, "FtPoints"),
    blkd: num(row, "Fg2aBlocked"),
    lbfc: num(row, "Loose Ball Fouls"),
  };
  return COMPONENTS.map((c) => values[c.key]);
}

function toPlayer(row: Row): RawPlayer {
  return {
    id: String(row.EntityId),
    name: String(row.Name),
    team: String(row.TeamAbbreviation ?? ""),
    sec: num(row, "SecondsPlayed"),
    gp: num(row, "GamesPlayed"),
    v: componentValues(row),
    pts: num(row, "Points"),
    reb: num(row, "Rebounds"),
    ast: num(row, "Assists"),
  };
}

export async function fetchTotals(season: string, date?: string): Promise<RawPlayer[]> {
  const params: Record<string, string> = { Season: season, SeasonType: SEASON_TYPE, Type: "Player" };
  if (date) {
    params.FromDate = date;
    params.ToDate = date;
  }
  const data = await api<{ multi_row_table_data: Row[] }>("get-totals/nba", params);
  return (data.multi_row_table_data ?? []).filter((r) => num(r, "SecondsPlayed") > 0).map(toPlayer);
}

type ApiGame = {
  GameId: string;
  Date: string;
  HomePoints: number;
  AwayPoints: number;
  HomeTeamAbbreviation: string;
  AwayTeamAbbreviation: string;
};

/** Completed games for a season, grouped by date. */
export async function fetchSchedule(season: string): Promise<Map<string, RawGame[]>> {
  const data = await api<{ results: ApiGame[] }>("get-games/nba", { Season: season, SeasonType: SEASON_TYPE });
  const byDate = new Map<string, RawGame[]>();
  for (const g of data.results ?? []) {
    const games = byDate.get(g.Date) ?? [];
    games.push({
      id: g.GameId,
      home: g.HomeTeamAbbreviation,
      away: g.AwayTeamAbbreviation,
      homePts: g.HomePoints,
      awayPts: g.AwayPoints,
    });
    byDate.set(g.Date, games);
  }
  return byDate;
}

export function seasonForDate(date: string): string {
  const [y, m] = date.split("-").map(Number);
  const start = m >= 9 ? y : y - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

export function previousSeason(season: string): string {
  const start = Number(season.slice(0, 4)) - 1;
  return `${start}-${String((start + 1) % 100).padStart(2, "0")}`;
}

/** Today's date in US Eastern time, where the NBA schedule lives. */
export function todayEastern(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/New_York" }).format(new Date());
}

export const nightPath = (season: string, date: string) => path.join(RAW, "nights", season, `${date}.json`);
export const seasonPath = (season: string) => path.join(RAW, "seasons", `${season}.json`);

export async function writeJson(file: string, data: unknown) {
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, JSON.stringify(data) + "\n");
}

export async function readJson<T>(file: string): Promise<T> {
  return JSON.parse(await readFile(file, "utf8")) as T;
}

export async function listJson(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  return (await readdir(dir)).filter((f) => f.endsWith(".json")).sort();
}

export async function listDirs(dir: string): Promise<string[]> {
  if (!existsSync(dir)) return [];
  return (await readdir(dir, { withFileTypes: true })).filter((d) => d.isDirectory()).map((d) => d.name).sort();
}

export async function fetchNight(season: string, date: string, games: RawGame[]): Promise<RawNight> {
  const players = await fetchTotals(season, date);
  return { date, season, games, players };
}

export { sleep, existsSync };
