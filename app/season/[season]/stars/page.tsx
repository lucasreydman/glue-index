import type { Metadata } from "next";
import { Board } from "@/components/Board";
import { Page } from "@/components/Page";
import { SeasonHead } from "@/components/SeasonHead";
import { getIndex, getSeason } from "@/lib/data";
import { STAR_USAGE, USAGE_INDEX } from "@/lib/formula";

type Props = { params: Promise<{ season: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const index = await getIndex();
  return index.seasons.map((season) => ({ season }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;
  return { title: `Gluiest stars, ${season}` };
}

export default async function StarsPage({ params }: Props) {
  const { season } = await params;
  const [board, index] = await Promise.all([getSeason(season), getIndex()]);

  // Scores are unchanged: stars are still measured against every qualified player.
  const stars = board.players
    .filter((l) => l.v[USAGE_INDEX] >= STAR_USAGE)
    .map((l, i) => ({ ...l, rank: i + 1 }));
  const positive = stars.filter((l) => l.glue > 0).length;

  return (
    <Page id={`stars-${season}`}>
      <SeasonHead board={board} index={index} view="stars" label="Gluiest stars">
        <span className="nowrap">
          {stars.length} qualified players at {STAR_USAGE}%+ usage
        </span>{" "}
        ·{" "}
        <span className="nowrap">
          {positive} {positive === 1 ? "scores" : "score"} above zero
        </span>{" "}
        · <span className="nowrap">scored against the whole league, ranked among themselves</span>
      </SeasonHead>

      {stars.length > 0 ? (
        <Board lines={stars} kind="season" runnersTitle="Next nine" tableTitle="Every star" />
      ) : (
        <p className="empty">No qualified player is at {STAR_USAGE}% usage yet</p>
      )}
    </Page>
  );
}
