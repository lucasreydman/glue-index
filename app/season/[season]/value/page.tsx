import type { Metadata } from "next";
import { Page } from "@/components/Page";
import { SeasonHead } from "@/components/SeasonHead";
import { ValueTable, type ValueRow } from "@/components/ValueTable";
import { getIndex, getSeason } from "@/lib/data";
import { mediumDate, split } from "@/lib/format";

type Props = { params: Promise<{ season: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const index = await getIndex();
  return index.valueSeasons.map((season) => ({ season }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;
  return { title: `Best value, ${season}` };
}

export default async function ValuePage({ params }: Props) {
  const { season } = await params;
  const [board, index] = await Promise.all([getSeason(season), getIndex()]);

  // A ratio only means something for players who add GLUE, so the list is positive scores only.
  const rows: ValueRow[] = board.players
    .filter((l) => l.salary && l.aav && l.glue > 0)
    .map((l) => {
      const { up, down } = split(l.c);
      return {
        rank: 0,
        overall: l.rank,
        id: l.id,
        name: l.name,
        team: l.team,
        min: l.min,
        glue: l.glue,
        up,
        down,
        salary: l.salary!,
        aav: l.aav!,
        per: l.glue / (l.salary! / 1e6),
      };
    })
    .sort((a, b) => b.per - a.per)
    .map((r, i) => ({ ...r, rank: i + 1 }));
  const unlisted = board.players.filter((l) => !l.salary).length;

  return (
    <Page id={`value-${season}`}>
      <SeasonHead board={board} index={index} view="value" label="Most GLUE per dollar">
        <span className="nowrap">{rows.length} players with a positive score and a listed contract</span> ·{" "}
        <span className="nowrap">ranked by GLUE per $1M of this season&rsquo;s salary</span> ·{" "}
        <span className="nowrap">
          contracts from Basketball Reference, {board.salariesAsOf && mediumDate(board.salariesAsOf)}
        </span>
        {unlisted > 0 && (
          <>
            {" "}
            · <span className="nowrap">{unlisted} qualified players have no listed contract, mostly two-way deals</span>
          </>
        )}
      </SeasonHead>

      <ValueTable rows={rows} />
    </Page>
  );
}
