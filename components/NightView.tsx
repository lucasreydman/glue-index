import { getIndex, getNight } from "@/lib/data";
import { count, longDate, mediumDate } from "@/lib/format";
import { Board } from "./Board";
import { DateNav } from "./Pickers";

export async function NightView({ date }: { date: string }) {
  const [night, index] = await Promise.all([getNight(date), getIndex()]);
  const year = date.slice(0, 4);

  return (
    <>
      <header className="page-head">
        <div>
          <p className="meta">Glue guys of the night</p>
          <h1 className="page-title">
            {longDate(date)} <span className="page-title-dim">{year}</span>
          </h1>
          <p className="page-sub">
            {night.games.length} {night.games.length === 1 ? "game" : "games"} · {night.players.length} players at 15+
            minutes · scored against {count(night.baseline.games)} player-games from {mediumDate(night.baseline.from)}{" "}
            to {mediumDate(night.baseline.to)}
          </p>
        </div>
        <DateNav date={date} dates={index.nights} />
      </header>

      <ul className="scores" aria-label="Final scores">
        {night.games.map((g) => (
          <li key={g.id}>
            <span className={g.awayPts > g.homePts ? "won" : undefined}>
              {g.away} {g.awayPts}
            </span>
            <span className={g.homePts > g.awayPts ? "won" : undefined}>
              {g.home} {g.homePts}
            </span>
          </li>
        ))}
      </ul>

      <Board lines={night.players} kind="night" runnersTitle="Next nine" tableTitle="Full slate" />
    </>
  );
}
