import type { Metadata } from "next";
import Link from "next/link";
import { Ledger } from "@/components/Ledger";
import { Strip, stripScale } from "@/components/Strip";
import { getCareers, getIndex, getPlayer } from "@/lib/data";
import { COMPONENTS } from "@/lib/formula";
import { CREDIT_INDEXES, DEBIT_INDEXES, componentValue, count, shortDate, signed } from "@/lib/format";
import type { PlayerGame, PlayerSeason } from "@/lib/types";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;

export async function generateStaticParams() {
  const index = await getIndex();
  return index.playerIds.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const index = await getIndex();
  return { title: index.names[id] };
}

const ORDER = [...CREDIT_INDEXES, ...DEBIT_INDEXES];
const CHART_HEIGHT = 200;

function SeasonChart({ seasons }: { seasons: PlayerSeason[] }) {
  const top = Math.max(0, ...seasons.map((s) => s.glue));
  const bottom = Math.max(0, ...seasons.map((s) => -s.glue));
  const span = top + bottom || 1;
  const upHeight = Math.round((top / span) * CHART_HEIGHT);
  const downHeight = CHART_HEIGHT - upHeight;

  return (
    <div className="chart-scroll">
      <ol className="season-chart" style={{ gridTemplateColumns: `repeat(${seasons.length}, minmax(40px, 72px))` }}>
        {seasons.map((s) => {
          const size = Math.max(2, Math.round((Math.abs(s.glue) / span) * CHART_HEIGHT));
          const kind = `${s.glue < 0 ? "bar-down" : "bar-up"}${s.inProgress ? " bar-open" : ""}`;
          return (
            <li key={s.season}>
              <Link href={`/season/${s.season}`} title={`${s.season}: ${signed(s.glue)}, rank ${s.rank} of ${s.of}`}>
                <span className="chart-up" style={{ height: upHeight + 20 }}>
                  {s.glue >= 0 && (
                    <>
                      <span className="num chart-value">{signed(s.glue, 1)}</span>
                      <i className={`bar ${kind}`} style={{ height: size }} />
                    </>
                  )}
                </span>
                <span className="chart-down" style={{ height: downHeight + (bottom > 0 ? 20 : 0) }}>
                  {s.glue < 0 && (
                    <>
                      <i className={`bar ${kind}`} style={{ height: size }} />
                      <span className="num chart-value down">{signed(s.glue, 1)}</span>
                    </>
                  )}
                </span>
                <span className="num chart-label">{s.season.slice(2)}</span>
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function GameList({ title, games }: { title: string; games: PlayerGame[] }) {
  return (
    <div>
      <h2 className="section-title">{title}</h2>
      <ol className="game-list">
        {games.map((g) => (
          <li key={g.date} className="game">
            <Link href={`/night/${g.date}`}>{shortDate(g.date)}</Link>
            <span className="runner-team">
              {g.team} {g.home ? "vs" : "at"} {g.opp} · {Math.round(g.min)} min
            </span>
            <span className="num game-rank">
              {g.rank} of {g.of}
            </span>
            <span className={`num runner-score ${g.glue < 0 ? "down" : ""}`}>{signed(g.glue)}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

export default async function PlayerPage({ params }: Props) {
  const { id } = await params;
  const [player, careers] = await Promise.all([getPlayer(id), getCareers()]);
  const { career, seasons, games } = player;

  const current = seasons.find((s) => s.inProgress);
  const featured = current ?? seasons.at(-1);
  const scale = stripScale(seasons);
  const bestGames = [...games].sort((a, b) => b.glue - a.glue).slice(0, 8);
  const latestGames = [...games].reverse().slice(0, 8);
  const teams = [...new Set(seasons.map((s) => s.team))];

  return (
    <>
      <header className="page-head">
        <div>
          <p className="meta">Player</p>
          <h1 className="page-title">{player.name}</h1>
          <p className="page-sub">
            {seasons.length > 0
              ? `${teams.join(", ")} · ${seasons.length} qualified ${seasons.length === 1 ? "season" : "seasons"}, ${
                  seasons[0].season
                } to ${seasons.at(-1)!.season}`
              : "No qualified season yet. Single games at 15+ minutes are listed below"}
          </p>
        </div>
      </header>

      {(career || current) && (
        <dl className="figures">
          {career && (
            <>
              <div>
                <dt>Career GLUE</dt>
                <dd className={career.glue < 0 ? "down" : undefined}>{signed(career.glue)}</dd>
                <dd className="figure-note">
                  rank {count(career.rank)} of {count(careers.length)}
                </dd>
              </div>
              <div>
                <dt>Per season</dt>
                <dd className={career.avg < 0 ? "down" : undefined}>{signed(career.avg)}</dd>
                <dd className="figure-note">
                  over {career.seasons} completed {career.seasons === 1 ? "season" : "seasons"}
                </dd>
              </div>
              <div>
                <dt>Best season</dt>
                <dd className={career.best.glue < 0 ? "down" : undefined}>{signed(career.best.glue)}</dd>
                <dd className="figure-note">
                  <Link href={`/season/${career.best.season}`}>{career.best.season}</Link>
                </dd>
              </div>
            </>
          )}
          {current && (
            <div>
              <dt>This season</dt>
              <dd className={current.glue < 0 ? "down" : undefined}>{signed(current.glue)}</dd>
              <dd className="figure-note">
                rank {current.rank} of {current.of}, in progress
              </dd>
            </div>
          )}
        </dl>
      )}

      {seasons.length > 0 && featured && (
        <section className="player-split">
          <div className="card chart-card">
            <h2 className="section-title">GLUE by season</h2>
            <SeasonChart seasons={seasons} />
          </div>
          <div className="card lead-card">
            <h2 className="section-title">
              {featured.season} ledger{featured.inProgress ? ", in progress" : ""}
            </h2>
            <Ledger v={featured.v} c={featured.c} glue={featured.glue} />
          </div>
        </section>
      )}

      {seasons.length > 0 && (
        <section className="board-section">
          <h2 className="section-title">Season by season</h2>
          <div className="table-scroll">
            <table className="board">
              <thead>
                <tr className="board-groups">
                  <td colSpan={7} />
                  <th scope="colgroup" colSpan={CREDIT_INDEXES.length} className="group group-credit">
                    Credits
                  </th>
                  <th scope="colgroup" colSpan={DEBIT_INDEXES.length} className="group group-debit">
                    Debits
                  </th>
                </tr>
                <tr>
                  <th scope="col" className="col-name">
                    Season
                  </th>
                  <th scope="col">Team</th>
                  <th scope="col" className="num">
                    GP
                  </th>
                  <th scope="col" className="num">
                    Min
                  </th>
                  <th scope="col" className="num">
                    GLUE
                  </th>
                  <th scope="col" className="num">
                    Rank
                  </th>
                  <th scope="col" className="col-strip">
                    <span className="sr-only">Hurt and helped</span>
                  </th>
                  {ORDER.map((i, n) => (
                    <th
                      key={i}
                      scope="col"
                      title={COMPONENTS[i].label}
                      className={n === 0 || n === CREDIT_INDEXES.length ? "num group-start" : "num"}
                    >
                      {COMPONENTS[i].short}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...seasons].reverse().map((s) => (
                  <tr key={s.season}>
                    <th scope="row" className="col-name">
                      <Link href={`/season/${s.season}`}>{s.season}</Link>
                    </th>
                    <td className="col-team">{s.team}</td>
                    <td className="num">{s.gp}</td>
                    <td className="num">{count(s.min)}</td>
                    <td className={`num col-glue ${s.glue < 0 ? "down" : ""}`}>{signed(s.glue)}</td>
                    <td className="num">
                      {s.rank} of {s.of}
                    </td>
                    <td className="col-strip">
                      <Strip c={s.c} scale={scale} />
                    </td>
                    {ORDER.map((i, n) => (
                      <td
                        key={i}
                        className={`num ${s.v[i] === 0 ? "zero" : ""} ${
                          n === 0 || n === CREDIT_INDEXES.length ? "group-start" : ""
                        }`}
                      >
                        {componentValue(i, s.v[i])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {games.length > 0 && (
        <section className="game-split">
          <GameList title="Best nights" games={bestGames} />
          <GameList title="Latest nights" games={latestGames} />
        </section>
      )}
    </>
  );
}
