// Shapes of the scored JSON that scripts/build-data.ts writes and the site reads.

export type Game = { id: string; home: string; away: string; homePts: number; awayPts: number };

export type Line = {
  rank: number;
  id: string;
  name: string;
  team: string;
  /** Minutes played, one decimal. */
  min: number;
  gp: number;
  glue: number;
  /** Raw component values, in COMPONENTS order. */
  v: number[];
  /** Weighted z-score contributions, in COMPONENTS order. They sum to glue. */
  c: number[];
  pts: number;
  reb: number;
  ast: number;
  opp?: string;
  home?: boolean;
  /** This season's salary and the deal's average annual value, in dollars. Current season only. */
  salary?: number;
  aav?: number;
};

export type Baseline = { games: number; from: string; to: string; mean: number[]; sd: number[] };

export type Night = {
  date: string;
  season: string;
  games: Game[];
  baseline: Baseline;
  players: Line[];
};

export type SeasonBoard = {
  season: string;
  inProgress: boolean;
  /** Last game date included, when nightly data exists for the season. */
  asOf: string | null;
  teamGames: number;
  minMinutes: number;
  mean: number[];
  sd: number[];
  /** When contract data was last pulled, if this season has any. */
  salariesAsOf: string | null;
  players: Line[];
};

export type PlayerSeason = Line & { season: string; of: number; inProgress: boolean };

export type PlayerGame = {
  date: string;
  season: string;
  team: string;
  opp: string;
  home: boolean;
  min: number;
  glue: number;
  rank: number;
  of: number;
  v: number[];
};

export type CareerRow = {
  rank: number;
  id: string;
  name: string;
  glue: number;
  seasons: number;
  first: string;
  last: string;
  avg: number;
  best: { season: string; glue: number };
  teams: string[];
};

export type PlayerFile = {
  id: string;
  name: string;
  career: CareerRow | null;
  seasons: PlayerSeason[];
  games: PlayerGame[];
};

export type SiteIndex = {
  generatedAt: string;
  latest: string;
  /** Scored seasons, newest first. */
  seasons: string[];
  /** Seasons that have contract data, for the value view. */
  valueSeasons: string[];
  /** Seasons with night-by-night data, newest first. */
  nightSeasons: string[];
  /** Every scored night, oldest first. */
  nights: string[];
  playerIds: string[];
  names: Record<string, string>;
  careerSeasons: { first: string; last: string };
};
