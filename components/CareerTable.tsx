"use client";

import { Search } from "lucide-react";
import Link from "next/link";
import { ViewTransition, startTransition, useMemo, useState } from "react";
import { count, signed } from "@/lib/format";
import type { CareerRow } from "@/lib/types";

const PAGE = 100;

export function CareerTable({ rows }: { rows: CareerRow[] }) {
  const [query, setQuery] = useState("");
  const [bottom, setBottom] = useState(false);
  const [limit, setLimit] = useState(PAGE);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q)) : rows;
    return bottom ? [...filtered].reverse() : filtered;
  }, [rows, query, bottom]);
  const visible = matches.slice(0, limit);
  const scale = Math.max(1, rows[0]?.glue ?? 1, -(rows.at(-1)?.glue ?? 0));

  return (
    <section className="board-section">
      <div className="board-tools">
        <div className="toggle" role="group" aria-label="Order">
          <button type="button" aria-pressed={!bottom} onClick={() => startTransition(() => setBottom(false))}>
            Highest
          </button>
          <button type="button" aria-pressed={bottom} onClick={() => startTransition(() => setBottom(true))}>
            Lowest
          </button>
        </div>
        <label className="search">
          <Search size={16} strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only">Search players</span>
          <input
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setLimit(PAGE);
            }}
            autoComplete="off"
          />
        </label>
      </div>

      <ViewTransition update="swap" default="none">
      <div className="table-scroll">
        <table className="board board-careers">
          <thead>
            <tr>
              <th scope="col" className="num col-rank">
                #
              </th>
              <th scope="col" className="col-name">
                Player
              </th>
              <th scope="col" className="num">
                Career GLUE
              </th>
              <th scope="col" className="col-strip">
                <span className="sr-only">Career total, drawn to scale</span>
              </th>
              <th scope="col" className="num">
                Seasons
              </th>
              <th scope="col">Span</th>
              <th scope="col" className="num">
                Per season
              </th>
              <th scope="col" className="num">
                Best season
              </th>
              <th scope="col">Teams</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => (
              <tr key={r.id}>
                <td className="num col-rank">{count(r.rank)}</td>
                <th scope="row" className="col-name">
                  <Link href={`/player/${r.id}`}>{r.name}</Link>
                </th>
                <td className={`num col-glue ${r.glue < 0 ? "down" : ""}`}>{signed(r.glue)}</td>
                <td className="col-strip">
                  <span className="strip" aria-hidden="true">
                    <i className="bar bar-down" style={{ width: r.glue < 0 ? `${(-r.glue / scale) * 100}%` : 0 }} />
                    <i className="bar bar-up" style={{ width: r.glue > 0 ? `${(r.glue / scale) * 100}%` : 0 }} />
                  </span>
                </td>
                <td className="num">{r.seasons}</td>
                <td className="col-team">{r.first === r.last ? r.first : `${r.first} to ${r.last}`}</td>
                <td className={`num ${r.avg < 0 ? "down" : ""}`}>{signed(r.avg)}</td>
                <td className="num">
                  <Link href={`/season/${r.best.season}`}>{r.best.season}</Link> {signed(r.best.glue)}
                </td>
                <td className="col-team">{r.teams.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="empty">No player matches “{query}”</p>}
      </div>
      </ViewTransition>
      {matches.length > limit && (
        <button type="button" className="button more" onClick={() => setLimit(limit + 400)}>
          Show more of {count(matches.length)}
        </button>
      )}
    </section>
  );
}
