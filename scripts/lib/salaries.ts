// Current contracts from Basketball Reference. One page, pulled at most once a day,
// and always best-effort: if the pull fails the previous file stays in place.
import path from "node:path";
import { RAW } from "./pbp.ts";

const URL = "https://www.basketball-reference.com/contracts/players.html";

export type RawContract = {
  name: string;
  team: string;
  /** This season's salary in dollars. */
  salary: number;
  /** Average annual value over the listed years of the deal. */
  aav: number;
  years: number;
};

export type RawSalaries = { season: string; fetchedAt: string; source: string; players: RawContract[] };

export const salaryPath = (season: string) => path.join(RAW, "salaries", `${season}.json`);

/** "Nikola Jokić" and "Nikola Jokic", "Jaren Jackson Jr." and "Jaren Jackson" compare equal. */
export function nameKey(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[.'’]/g, "")
    .replace(/-/g, " ")
    .replace(/\s+(jr|sr|ii|iii|iv|v)$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

const cell = (row: string, stat: string) =>
  row.match(new RegExp(`data-stat="${stat}"[^>]*>(.*?)</t[dh]>`, "s"))?.[1] ?? "";
const text = (html: string) => html.replace(/<[^>]+>/g, "").replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").trim();
const dollars = (row: string, stat: string) => Number(row.match(new RegExp(`data-stat="${stat}" csk="([0-9]+)"`))?.[1] ?? 0);

export async function fetchSalaries(): Promise<RawSalaries> {
  const res = await fetch(URL, {
    headers: { "User-Agent": "Mozilla/5.0 (compatible; glue-index-pipeline)" },
    signal: AbortSignal.timeout(60_000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();

  const season = html.match(/data-stat="y1"[^>]*>(\d{4}-\d{2})</)?.[1];
  if (!season) throw new Error("could not find the season column");

  const seen = new Set<string>();
  const players: RawContract[] = [];
  for (const [, row] of html.matchAll(/<tr ?>(<th scope="row".*?)<\/tr>/gs)) {
    const name = text(cell(row, "player"));
    const years = ["y1", "y2", "y3", "y4", "y5", "y6"].map((y) => dollars(row, y)).filter((x) => x > 0);
    const salary = dollars(row, "y1");
    if (!name || !salary || seen.has(nameKey(name))) continue;
    seen.add(nameKey(name));
    players.push({
      name,
      team: text(cell(row, "team_id")),
      salary,
      aav: Math.round(years.reduce((a, b) => a + b, 0) / years.length),
      years: years.length,
    });
  }
  if (players.length < 300) throw new Error(`only ${players.length} contracts parsed`);
  return { season, fetchedAt: new Date().toISOString(), source: URL, players };
}
