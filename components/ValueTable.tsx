"use client";

import { ArrowDown, ArrowUp, Search } from "lucide-react";
import Link from "next/link";
import { ViewTransition, startTransition, useMemo, useState } from "react";
import { count, money, signed } from "@/lib/format";
import { useLazyRows } from "./useLazyRows";


export type ValueRow = {
  rank: number;
  /** Rank on the full season board. */
  overall: number;
  id: string;
  name: string;
  team: string;
  min: number;
  glue: number;
  up: number;
  down: number;
  salary: number;
  aav: number;
  per: number;
};

type SortKey = "per" | "glue" | "salary" | "aav" | "min" | "name";

export function ValueTable({ rows }: { rows: ValueRow[] }) {
  const [sort, setSort] = useState<{ key: SortKey; desc: boolean }>({ key: "per", desc: true });
  const [query, setQuery] = useState("");

  const scale = useMemo(() => rows.reduce((m, r) => Math.max(m, r.up, -r.down), 1), [rows]);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = q ? rows.filter((r) => r.name.toLowerCase().includes(q) || r.team.toLowerCase() === q) : rows;
    return [...filtered].sort((a, b) => {
      const x = a[sort.key];
      const y = b[sort.key];
      const order = typeof x === "string" ? x.localeCompare(y as string) : x - (y as number);
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
        <h2 className="section-title">Best value</h2>
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
          <table className="board board-careers">
            <thead>
              <tr>
                <th scope="col" className="num col-rank">
                  #
                </th>
                {header("name", "Player", undefined, "col-name")}
                <th scope="col">Team</th>
                {header("min", "Min", "Minutes played")}
                {header("glue", "GLUE")}
                <th scope="col" className="col-strip">
                  <span className="sr-only">Hurt and helped</span>
                </th>
                <th scope="col" className="num" title="Rank among every qualified player">
                  Overall
                </th>
                {header("salary", "Salary", "This season's salary")}
                {header("aav", "AAV", "Average annual value over the listed years of the contract")}
                {header("per", "GLUE per $1M", "GLUE divided by this season's salary in millions")}
              </tr>
            </thead>
            <tbody>
              {visible.slice(0, limit).map((r) => (
                <tr key={r.id}>
                  <td className="num col-rank">{r.rank}</td>
                  <th scope="row" className="col-name">
                    <Link href={`/player/${r.id}`}>{r.name}</Link>
                  </th>
                  <td className="col-team">{r.team}</td>
                  <td className="num">{count(r.min)}</td>
                  <td className="num">{signed(r.glue)}</td>
                  <td className="col-strip">
                    <span className="strip" aria-hidden="true">
                      <i className="bar bar-down" style={{ width: pct(r.down) }} />
                      <i className="bar bar-up" style={{ width: pct(r.up) }} />
                    </span>
                  </td>
                  <td className="num">{r.overall}</td>
                  <td className="num">{money(r.salary)}</td>
                  <td className="num">{money(r.aav)}</td>
                  <td className="num col-glue">{signed(r.per)}</td>
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
