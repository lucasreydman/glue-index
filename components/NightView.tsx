import { getIndex, getNight } from "@/lib/data";
import { count, dateRange, longDate } from "@/lib/format";
import { Board } from "./Board";
import { Page } from "./Page";
import { DateNav } from "./Pickers";

export async function NightView({ date }: { date: string }) {
  const [night, index] = await Promise.all([getNight(date), getIndex()]);
  const year = date.slice(0, 4);

  return (
    <Page id={`night-${date}`}>
      <header className="page-head">
        <div>
          <p className="meta">Glue guys of the night</p>
          <h1 className="page-title">
            {longDate(date)} <span className="page-title-dim">{year}</span>
          </h1>
          <p className="page-sub">
            <span className="nowrap">
              {night.games.length} {night.games.length === 1 ? "game" : "games"}
            </span>{" "}
            · <span className="nowrap">{night.players.length} players at 15+ minutes</span> ·{" "}
            <span className="nowrap">scored against {count(night.baseline.games)} player-games,</span>{" "}
            <span className="nowrap">{dateRange(night.baseline.from, night.baseline.to)}</span>
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
    </Page>
  );
}
