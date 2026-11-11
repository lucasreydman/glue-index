import { COMPONENTS, USAGE_INDEX } from "./formula";

const MINUS = "−";

export function signed(x: number, places = 2): string {
  const fixed = Math.abs(x).toFixed(places);
  if (Number(fixed) === 0) return fixed;
  return (x < 0 ? MINUS : "+") + fixed;
}

/** Dollars as millions: $62.6M. */
export function money(x: number): string {
  return `$${(x / 1e6).toFixed(1)}M`;
}

export function count(x: number): string {
  return Math.round(x).toLocaleString("en-US");
}

export function componentValue(index: number, value: number): string {
  return index === USAGE_INDEX ? value.toFixed(1) : String(value);
}

const utc = (date: string) => new Date(`${date}T00:00:00Z`);

export function longDate(date: string): string {
  return utc(date).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
}

export function mediumDate(date: string): string {
  return utc(date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });
}

/** "Apr 8 to Nov 8, 2026", or with both years when the range crosses one. */
export function dateRange(from: string, to: string): string {
  if (from.slice(0, 4) !== to.slice(0, 4)) return `${mediumDate(from)} to ${mediumDate(to)}`;
  const start = utc(from).toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
  return `${start} to ${mediumDate(to)}`;
}

export function shortDate(date: string): string {
  return utc(date).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
}

export function monthLabel(yearMonth: string): string {
  return utc(`${yearMonth}-01`).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** Sum of the contributions that helped and the ones that hurt. */
export function split(c: number[]): { up: number; down: number } {
  let up = 0;
  let down = 0;
  for (const x of c) {
    if (x > 0) up += x;
    else down += x;
  }
  return { up, down };
}

export const CREDIT_INDEXES = COMPONENTS.flatMap((c, i) => (c.side === "credit" ? [i] : []));
export const DEBIT_INDEXES = COMPONENTS.flatMap((c, i) => (c.side === "debit" ? [i] : []));
