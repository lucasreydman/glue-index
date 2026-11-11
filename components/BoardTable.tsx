"use client";

import { ArrowDown, ArrowUp, Search } from "lucide-react";
import Link from "next/link";
import { ViewTransition, startTransition, useMemo, useState } from "react";
import { COMPONENTS } from "@/lib/formula";
import { CREDIT_INDEXES, DEBIT_INDEXES, componentValue, count, signed } from "@/lib/format";
import { useLazyRows } from "./useLazyRows";


export type BoardRow = {
  rank: number;
  id: string;
  name: string;
  team: string;
  where: string;
  min: number;
  gp: number;
  glue: number;
  up: number;
  down: number;
  v: number[];
};

type SortKey = "glue" | "name" | "min" | "gp" | number;
type Props = { rows: BoardRow[]; kind: "night" | "season"; title: string };

const ORDER = [...CREDIT_INDEXES, ...DEBIT_INDEXES];

export function BoardTable({ rows, kind, title }: Props) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "glue", desc: true });
  const [query, setQuery] = useState("");

  const scale = useMemo(() => rows.reduce((m, r) => Math.max(m, r.up, -r.down), 1), [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.team.toLowerCase() === q) : rows;
    const value = (r: BoardRow) => (typeof sort.key === "number" ? r.v[sort.key] : r[sort.key]);
    return [...filtered].sort((a, b) => {
      const x = value(a);
      const y = value(b);
      const order = typeof x === "string" ? x.localeCompare(y as string) : (x as number) - (y as number);
      return (sort.desc ? -order : order) || a.rank - b.rank;
    });
  }, [rows, query, sort]);

  const { limit, more, sentinel } = useLazyRows(visible.length);

  const header = (key: SortKey, label: string, title?: string, className = "num") => {
    const active = sort.key === key;
    return (
      <th
        scope="col"
        className={className}
        title={title}
        aria-sort={active ? (sort.desc ? "descending" : "ascending") : undefined}
      >
        <button
          type="button"
          className="sort"
          onClick={() => startTransition(() => setSort({ key, desc: active ? !sort.desc : key !== "name" }))}
        >
          {label}
          {active && (sort.desc ? <ArrowDown size={12} strokeWidth={1.5} /> : <ArrowUp size={12} strokeWidth={1.5} />)}
        </button>
      </th>
    );
  };

  const pct = (x: number) => `${Math.min(100, (Math.abs(x) / scale) * 100)}%`;

  return (
    <section className="board-section">
      <div className="board-tools">
        <h2 className="section-title">{title}</h2>
        <label className="search">
          <Search size={16} strokeWidth={1.5} aria-hidden="true" />
          <span className="sr-only">Search players</span>
          <input
            type="search"
            placeholder="Search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
          />
        </label>
      </div>

      <ViewTransition update="swap" default="none">
      <div className="table-scroll">
        <table className="board">
          <thead>
            <tr className="board-groups">
              <td colSpan={kind === "season" ? 7 : 6} />
              <th scope="colgroup" colSpan={CREDIT_INDEXES.length} className="group group-credit">
                Credits
              </th>
              <th scope="colgroup" colSpan={DEBIT_INDEXES.length} className="group group-debit">
                Debits
              </th>
            </tr>
            <tr>
              <th scope="col" className="num col-rank">
                #
              </th>
              {header("name", "Player", undefined, "col-name")}
              <th scope="col">{kind === "night" ? "Game" : "Team"}</th>
              {kind === "season" && header("gp", "GP", "Games played")}
              {header("min", "Min", "Minutes played")}
              {header("glue", "GLUE")}
              <th scope="col" className="col-strip">
                <span className="sr-only">Hurt and helped</span>
              </th>
              {ORDER.map((i, n) =>
                header(
                  i,
                  COMPONENTS[i].short,
                  COMPONENTS[i].label,
                  n === 0 || n === CREDIT_INDEXES.length ? "num group-start" : "num",
                ),
              )}
            </tr>
          </thead>
          <tbody>
            {visible.slice(0, limit).map((r) => (
              <tr key={r.id}>
                <td className="num col-rank">{r.rank}</td>
                <th scope="row" className="col-name">
                  <Link href={`/player/${r.id}`}>{r.name}</Link>
                </th>
                <td className="col-team">{r.where}</td>
                {kind === "season" && <td className="num">{r.gp}</td>}
                <td className="num">{count(r.min)}</td>
                <td className={`num col-glue ${r.glue < 0 ? "down" : ""}`}>{signed(r.glue)}</td>
                <td className="col-strip">
                  <span className="strip" aria-hidden="true">
                    <i className="bar bar-down" style={{ width: pct(r.down) }} />
                    <i className="bar bar-up" style={{ width: pct(r.up) }} />
                  </span>
                </td>
                {ORDER.map((i, n) => (
                  <td
                    key={i}
                    className={`num ${r.v[i] === 0 ? "zero" : ""} ${
                      n === 0 || n === CREDIT_INDEXES.length ? "group-start" : ""
                    }`}
                  >
                    {componentValue(i, r.v[i])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {visible.length === 0 && <p className="empty">No player matches “{query}”</p>}
        {more && (
          <div ref={sentinel} className="more-rows">
            Showing {limit} of {count(visible.length)}
          </div>
        )}
      </div>
      </ViewTransition>
    </section>
  );
}
