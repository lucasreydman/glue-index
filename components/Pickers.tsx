"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { monthLabel, shortDate } from "@/lib/format";

type DateNavProps = { date: string; dates: string[] };

/** Step a night back or forward, or jump to any scored night. */
export function DateNav({ date, dates }: DateNavProps) {
  const router = useRouter();
  const at = dates.indexOf(date);
  const prev = dates[at - 1];
  const next = dates[at + 1];

  const months = new Map<string, string[]>();
  for (const d of [...dates].reverse()) {
    const key = d.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), d]);
  }

  const step = (target: string | undefined, label: string, icon: React.ReactNode) =>
    target ? (
      <Link className="step" href={`/night/${target}`} aria-label={label} title={label}>
        {icon}
      </Link>
    ) : (
      <span className="step" aria-disabled="true">
        {icon}
      </span>
    );

  return (
    <div className="picker">
      {step(prev, "Previous night", <ChevronLeft size={16} strokeWidth={1.5} />)}
      <label className="select">
        <span className="sr-only">Jump to a night</span>
        <select value={date} onChange={(e) => router.push(`/night/${e.target.value}`)}>
          {[...months].map(([month, days]) => (
            <optgroup key={month} label={monthLabel(month)}>
              {days.map((d) => (
                <option key={d} value={d}>
                  {shortDate(d)}
                </option>
              ))}
            </optgroup>
          ))}
        </select>
      </label>
      {step(next, "Next night", <ChevronRight size={16} strokeWidth={1.5} />)}
    </div>
  );
}

type SeasonNavProps = { season: string; seasons: string[] };

/** Seasons are listed newest first, so "next" walks toward index 0. */
export function SeasonNav({ season, seasons }: SeasonNavProps) {
  const router = useRouter();
  const at = seasons.indexOf(season);
  const prev = seasons[at + 1];
  const next = seasons[at - 1];

  const step = (target: string | undefined, label: string, icon: React.ReactNode) =>
    target ? (
      <Link className="step" href={`/season/${target}`} aria-label={label} title={label}>
        {icon}
      </Link>
    ) : (
      <span className="step" aria-disabled="true">
        {icon}
      </span>
    );

  return (
    <div className="picker">
      {step(prev, "Previous season", <ChevronLeft size={16} strokeWidth={1.5} />)}
      <label className="select">
        <span className="sr-only">Jump to a season</span>
        <select value={season} onChange={(e) => router.push(`/season/${e.target.value}`)}>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      {step(next, "Next season", <ChevronRight size={16} strokeWidth={1.5} />)}
    </div>
  );
}
