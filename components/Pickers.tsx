"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { monthLabel, shortDate } from "@/lib/format";
import { NAVIGATE_EVENT } from "./NavProgress";

const announce = () => window.dispatchEvent(new Event(NAVIGATE_EVENT));

type StepProps = { href?: string; label: string; back?: boolean };

/** A previous or next arrow. The page slides the way the arrow points. */
function Step({ href, label, back }: StepProps) {
  const icon = back ? <ChevronLeft size={16} strokeWidth={1.5} /> : <ChevronRight size={16} strokeWidth={1.5} />;
  if (!href) {
    return (
      <span className="step" aria-disabled="true">
        {icon}
      </span>
    );
  }
  return (
    <Link className="step" href={href} aria-label={label} title={label} transitionTypes={[back ? "nav-back" : "nav-forward"]}>
      {icon}
    </Link>
  );
}

type DateNavProps = { date: string; dates: string[] };

/** Step a night back or forward, or jump to any scored night. */
export function DateNav({ date, dates }: DateNavProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const at = dates.indexOf(date);
  const prev = dates[at - 1];
  const next = dates[at + 1];

  const months = new Map<string, string[]>();
  for (const d of [...dates].reverse()) {
    const key = d.slice(0, 7);
    months.set(key, [...(months.get(key) ?? []), d]);
  }

  return (
    <div className="picker" data-pending={pending || undefined}>
      <Step href={prev && `/night/${prev}`} label="Previous night" back />
      <label className="select">
        <span className="sr-only">Jump to a night</span>
        <select value={date} onChange={(e) => {
            const target = `/night/${e.target.value}`;
            announce();
            startTransition(() => router.push(target));
          }}>
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
      <Step href={next && `/night/${next}`} label="Next night" />
    </div>
  );
}

type SeasonNavProps = { season: string; seasons: string[]; suffix?: string };

/** Seasons are listed newest first, so "next" walks toward index 0. */
export function SeasonNav({ season, seasons, suffix = "" }: SeasonNavProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const at = seasons.indexOf(season);
  const prev = seasons[at + 1];
  const next = seasons[at - 1];
  const href = (s: string) => `/season/${s}${suffix}`;

  return (
    <div className="picker" data-pending={pending || undefined}>
      <Step href={prev && href(prev)} label="Previous season" back />
      <label className="select">
        <span className="sr-only">Jump to a season</span>
        <select value={season} onChange={(e) => {
            const target = href(e.target.value);
            announce();
            startTransition(() => router.push(target));
          }}>
          {seasons.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>
      <Step href={next && href(next)} label="Next season" />
    </div>
  );
}
