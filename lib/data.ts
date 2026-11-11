import { readFile } from "node:fs/promises";
import path from "node:path";
import { cache } from "react";
import type { CareerRow, Night, PlayerFile, SeasonBoard, SiteIndex } from "./types";

const SITE = path.join(process.cwd(), "data", "site");

async function read<T>(...parts: string[]): Promise<T> {
  return JSON.parse(await readFile(path.join(SITE, ...parts), "utf8")) as T;
}

export const getIndex = cache(() => read<SiteIndex>("index.json"));
export const getNight = cache((date: string) => read<Night>("nights", `${date}.json`));
export const getSeason = cache((season: string) => read<SeasonBoard>("seasons", `${season}.json`));
export const getPlayer = cache((id: string) => read<PlayerFile>("players", `${id}.json`));
export const getCareers = cache(() => read<CareerRow[]>("careers.json"));

/** The most recent season that has finished, used for worked examples. */
export const getLatestCompleteSeason = cache(async () => {
  const index = await getIndex();
  for (const season of index.seasons) {
    const board = await getSeason(season);
    if (!board.inProgress) return board;
  }
  return getSeason(index.seasons[0]);
});
