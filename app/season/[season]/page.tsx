import type { Metadata } from "next";
import { Board } from "@/components/Board";
import { Page } from "@/components/Page";
import { SeasonHead } from "@/components/SeasonHead";
import { getIndex, getSeason } from "@/lib/data";
import { count, mediumDate } from "@/lib/format";

type Props = { params: Promise<{ season: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const index = await getIndex();
  return index.seasons.map((season) => ({ season }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { season } = await params;
  return { title: `${season} season` };
}

export default async function SeasonPage({ params }: Props) {
  const { season } = await params;
  const [board, index] = await Promise.all([getSeason(season), getIndex()]);

  return (
    <Page id={`season-${season}`}>
      <SeasonHead board={board} index={index} view="everyone" label="Season leaderboard">
        <span className="nowrap">
          {board.players.length} players at {count(board.minMinutes)}+ minutes
        </span>
        {board.inProgress && (
          <>
            {" "}
            · <span className="nowrap">{board.teamGames} of 82 games played</span>
            {board.asOf && (
              <>
                {" "}
                · <span className="nowrap">through {mediumDate(board.asOf)}</span>
              </>
            )}
          </>
        )}
        {!board.inProgress && board.teamGames < 82 && ` · ${board.teamGames}-game season`}
      </SeasonHead>

      <Board lines={board.players} kind="season" runnersTitle="Next nine" tableTitle="Every qualified player" />
    </Page>
  );
}
