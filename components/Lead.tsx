import Link from "next/link";
import { count, signed } from "@/lib/format";
import type { Line } from "@/lib/types";
import { Ledger } from "./Ledger";
import { Strip, stripScale } from "./Strip";

type Props = { lines: Line[]; kind: "night" | "season"; runnersTitle: string };

function context(line: Line, kind: Props["kind"]): string {
  if (kind === "night") {
    const where = line.opp ? `${line.team} ${line.home ? "vs" : "at"} ${line.opp}` : line.team;
    return `${where} · ${Math.round(line.min)} min · ${line.pts} pts, ${line.reb} reb, ${line.ast} ast`;
  }
  return `${line.team} · ${line.gp} games · ${count(line.min)} min`;
}

/** The top of a board: the leader's full ledger beside the next nine. */
export function Lead({ lines, kind, runnersTitle }: Props) {
  const [first, ...rest] = lines;
  if (!first) return null;
  const runners = rest.slice(0, 9);
  const last = lines.length > 13 ? lines.slice(-3) : [];
  const scale = stripScale([...lines.slice(0, 10), ...last]);

  const list = (items: Line[]) => (
    <ol className="runner-list">
      {items.map((l) => (
        <li key={l.id} className="runner">
          <span className="num runner-rank">{l.rank}</span>
          <span className="runner-who">
            <Link href={`/player/${l.id}`}>{l.name}</Link>
            <span className="runner-team">
              {kind === "night" && l.opp ? `${l.team} ${l.home ? "vs" : "at"} ${l.opp}` : l.team}
            </span>
          </span>
          <Strip c={l.c} scale={scale} />
          <span className={`num runner-score ${l.glue < 0 ? "down" : ""}`}>{signed(l.glue)}</span>
        </li>
      ))}
    </ol>
  );

  return (
    <section className="lead">
      <article className="card lead-card">
        <header className="lead-head">
          <div>
            <p className="meta">Rank 1</p>
            <h2 className="lead-name">
              <Link href={`/player/${first.id}`}>
                <mark>{first.name}</mark>
              </Link>
            </h2>
            <p className="lead-context">{context(first, kind)}</p>
          </div>
          <p className="lead-score">
            <span className="meta">GLUE</span>
            <span className="figure">{signed(first.glue)}</span>
          </p>
        </header>
        <Ledger v={first.v} c={first.c} glue={first.glue} />
      </article>

      <div className="runners">
        <div>
          <h2 className="section-title">{runnersTitle}</h2>
          {list(runners)}
        </div>
        {last.length > 0 && (
          <div>
            <h2 className="section-title">Bottom three</h2>
            {list(last)}
          </div>
        )}
      </div>
    </section>
  );
}
