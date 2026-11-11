import type { Metadata } from "next";
import { Board } from "@/components/Board";
import { SeasonNav } from "@/components/Pickers";
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
    <>
      <header className="page-head">
        <div>
          <p className="meta">Season leaderboard</p>
          <h1 className="page-title">
            {board.season}{" "}
            {board.inProgress && <span className="page-title-dim">in progress</span>}
          </h1>
          <p className="page-sub">
            {board.players.length} players at {count(board.minMinutes)}+ minutes
            {board.inProgress &&
              ` · ${board.teamGames} of 82 games played${board.asOf ? ` · through ${mediumDate(board.asOf)}` : ""}`}
            {!board.inProgress && board.teamGames < 82 && ` · ${board.teamGames}-game season`}
          </p>
        </div>
        <SeasonNav season={season} seasons={index.seasons} />
      </header>

      <Board lines={board.players} kind="season" runnersTitle="Next nine" tableTitle="Every qualified player" />
    </>
  );
}
