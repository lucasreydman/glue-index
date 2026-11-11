// Pulls raw data from pbpstats into data/raw. Scoring happens in build-data.ts.
//
//   node scripts/fetch.ts nightly                 new nights + current season totals (the cron job)
//   node scripts/fetch.ts nights 2025-26          every game date of a season (backfill, resumable;
//                                                 add --reverse and/or --middle to start elsewhere)
//   node scripts/fetch.ts seasons 2005-06 2026-27 season totals for a range of seasons
//   node scripts/fetch.ts salaries                current contracts (best-effort)
import {
  existsSync,
  fetchNight,
  fetchSchedule,
  fetchTotals,
  nightPath,
  seasonForDate,
  seasonPath,
  sleep,
  todayEastern,
  writeJson,
} from "./lib/pbp.ts";
import { fetchSalaries, salaryPath } from "./lib/salaries.ts";

const PAUSE_MS = 1500;

async function pullNights(season: string, { refetchLast = 0, reverse = false, fromMiddle = false } = {}) {
  const today = todayEastern();
  const schedule = await fetchSchedule(season);
  const dates = [...schedule.keys()].filter((d) => d < today).sort();
  const refetch = new Set(dates.slice(dates.length - refetchLast));
  let pulled = 0;
  // Backfills can run as several workers at once: each starts somewhere else and skips what exists.
  let order = reverse ? [...dates].reverse() : dates;
  if (fromMiddle) order = [...order.slice(order.length >> 1), ...order.slice(0, order.length >> 1)];
  for (const date of order) {
    const file = nightPath(season, date);
    if (existsSync(file) && !refetch.has(date)) continue;
    const night = await fetchNight(season, date, schedule.get(date)!);
    if (night.players.length === 0) {
      console.warn(`${date}: no player rows yet, skipping`);
      continue;
    }
    await writeJson(file, night);
    pulled++;
    console.log(`${date}: ${night.games.length} games, ${night.players.length} players`);
    await sleep(PAUSE_MS);
  }
  console.log(`${season}: ${pulled} nights written, ${dates.length} game dates so far`);
}

async function pullSeason(season: string) {
  const players = await fetchTotals(season);
  if (players.length === 0) {
    console.warn(`${season}: no data`);
    return;
  }
  await writeJson(seasonPath(season), { season, fetchedAt: new Date().toISOString(), players });
  console.log(`${season}: ${players.length} players`);
}

/** Never fails the run: a blocked or changed page just leaves the last good file in place. */
async function pullSalaries() {
  try {
    const salaries = await fetchSalaries();
    await writeJson(salaryPath(salaries.season), salaries);
    console.log(`salaries ${salaries.season}: ${salaries.players.length} contracts`);
  } catch (err) {
    console.warn(`salaries: skipped, ${err}`);
  }
}

function seasonRange(from: string, to: string): string[] {
  const out: string[] = [];
  for (let y = Number(from.slice(0, 4)); y <= Number(to.slice(0, 4)); y++) {
    out.push(`${y}-${String((y + 1) % 100).padStart(2, "0")}`);
  }
  return out;
}

const [command, a, b] = process.argv.slice(2);

if (command === "nightly") {
  const season = seasonForDate(todayEastern());
  // Re-pull the two most recent nights as well, to pick up stat corrections.
  await pullNights(season, { refetchLast: 2 });
  await pullSeason(season);
  await pullSalaries();
} else if (command === "salaries") {
  await pullSalaries();
} else if (command === "nights" && a) {
  const flags = process.argv.slice(4);
  await pullNights(a, { reverse: flags.includes("--reverse"), fromMiddle: flags.includes("--middle") });
} else if (command === "seasons" && a) {
  for (const season of seasonRange(a, b ?? a)) {
    await pullSeason(season);
    await sleep(PAUSE_MS);
  }
} else {
  console.error("usage: fetch.ts nightly | nights <season> | seasons <from> [to] | salaries");
  process.exit(1);
}
