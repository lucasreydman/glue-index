// GLUE v1.0 — Grit Less Usage & Errors.
// The single source of truth for components and weights. Imported by both the
// data pipeline (scripts/) and the site, so it must stay dependency-free.

export type Side = "credit" | "debit";

export type Component = {
  key: string;
  label: string;
  short: string;
  weight: number;
  side: Side;
  /** How the value is read from a pbpstats totals row. */
  source: string;
  why: string;
};

export const COMPONENTS: readonly Component[] = [
  {
    key: "stl",
    label: "Steals",
    short: "STL",
    weight: 1.0,
    side: "credit",
    source: "Steals",
    why: "Takes a possession from the opponent and usually starts a break",
  },
  {
    key: "rblk",
    label: "Recovered blocks",
    short: "RBK",
    weight: 1.0,
    side: "credit",
    source: "RecoveredBlocks",
    why: "Only blocks the defense keeps. A block swatted out of bounds gives the ball back",
  },
  {
    key: "ofd",
    label: "Offensive fouls drawn",
    short: "OFD",
    weight: 0.9,
    side: "credit",
    source: "Offensive Fouls Drawn",
    why: "Ends the possession and puts a foul on an opponent",
  },
  {
    key: "oreb",
    label: "Offensive rebounds",
    short: "ORB",
    weight: 0.8,
    side: "credit",
    source: "OffRebounds",
    why: "Buys the offense a second possession",
  },
  {
    key: "fg3m",
    label: "Threes made",
    short: "3PM",
    weight: 0.7,
    side: "credit",
    source: "FG3M",
    why: "Spacing that works without the ball",
  },
  {
    key: "ftm",
    label: "Free throws made",
    short: "FTM",
    weight: 0.4,
    side: "credit",
    source: "FtPoints",
    why: "Drawing contact and converting it",
  },
  {
    key: "lbfd",
    label: "Loose ball fouls drawn",
    short: "LBD",
    weight: 0.4,
    side: "credit",
    source: "Loose Ball Fouls Drawn",
    why: "Winning the scrum. Trimmed because it tracks offensive rebounding (r = 0.78)",
  },
  {
    key: "lto",
    label: "Live-ball turnovers",
    short: "LTO",
    weight: -1.1,
    side: "debit",
    source: "LiveBallTurnovers",
    why: "Hands the opponent a possession on the run",
  },
  {
    key: "usg",
    label: "Usage rate",
    short: "USG",
    weight: -1.1,
    side: "debit",
    source: "Usage",
    why: "The gatekeeper. It keeps this a glue metric and not a best-player metric",
  },
  {
    key: "badf",
    label: "Bad fouls",
    short: "BDF",
    weight: -0.8,
    side: "debit",
    source: "ShootingFouls + NonShootingPenaltyNonTakeFouls",
    why: "Fouls that sent an opponent straight to the line",
  },
  {
    key: "ofc",
    label: "Offensive fouls committed",
    short: "OFC",
    weight: -0.5,
    side: "debit",
    source: "Offensive Fouls",
    why: "The mirror of offensive fouls drawn",
  },
  {
    key: "mft",
    label: "Missed free throws",
    short: "MFT",
    weight: -0.3,
    side: "debit",
    source: "FTA − FtPoints",
    why: "Points left at the line",
  },
  {
    key: "blkd",
    label: "Shots blocked",
    short: "BKD",
    weight: -0.3,
    side: "debit",
    source: "Fg2aBlocked",
    why: "Two-point attempts that got sent back",
  },
  {
    key: "lbfc",
    label: "Loose ball fouls committed",
    short: "LBC",
    weight: -0.3,
    side: "debit",
    source: "Loose Ball Fouls",
    why: "The mirror of loose ball fouls drawn",
  },
];

export const N_COMPONENTS = COMPONENTS.length;
export const USAGE_INDEX = COMPONENTS.findIndex((c) => c.key === "usg");

export const SEASON_MIN_MINUTES = 1000;
export const SEASON_GAMES = 82;
export const GAME_MIN_SECONDS = 15 * 60;
/** A night's baseline is topped up from neighbouring games until it has this many player-games. */
export const BASELINE_MIN_GAMES = 3000;

export const ACRONYM = "Grit Less Usage & Errors";
export const VERSION = "1.0";
