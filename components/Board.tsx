import { split } from "@/lib/format";
import type { Line } from "@/lib/types";
import { BoardTable, type BoardRow } from "./BoardTable";
import { Lead } from "./Lead";

type Props = { lines: Line[]; kind: "night" | "season"; runnersTitle: string; tableTitle: string };

/** A leaderboard: the leader's ledger, the next nine, then every qualified player. */
export function Board({ lines, kind, runnersTitle, tableTitle }: Props) {
  const rows: BoardRow[] = lines.map((l) => {
    const { up, down } = split(l.c);
    return {
      rank: l.rank,
      id: l.id,
      name: l.name,
      team: l.team,
      where: kind === "night" && l.opp ? `${l.team} ${l.home ? "vs" : "at"} ${l.opp}` : l.team,
      min: l.min,
      gp: l.gp,
      glue: l.glue,
      up,
      down,
      v: l.v,
    };
  });
  return (
    <>
      <Lead lines={lines} kind={kind} runnersTitle={runnersTitle} />
      <BoardTable rows={rows} kind={kind} title={tableTitle} />
    </>
  );
}
