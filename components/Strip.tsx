import { signed, split } from "@/lib/format";

/** The signature mark: what helped drawn right in green ink, what hurt drawn left in red. */
export function Strip({ c, scale }: { c: number[]; scale: number }) {
  const { up, down } = split(c);
  const pct = (x: number) => `${Math.min(100, (Math.abs(x) / scale) * 100)}%`;
  return (
    <span className="strip" role="img" aria-label={`helped ${signed(up)}, hurt ${signed(down)}`}>
      <i className="bar bar-down" style={{ width: pct(down) }} />
      <i className="bar bar-up" style={{ width: pct(up) }} />
    </span>
  );
}

/** One shared scale for a list of strips, so rows can be compared by eye. */
export function stripScale(lines: { c: number[] }[]): number {
  let max = 1;
  for (const l of lines) {
    const { up, down } = split(l.c);
    max = Math.max(max, up, -down);
  }
  return max;
}
