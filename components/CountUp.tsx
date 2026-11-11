"use client";

import { useLayoutEffect, useRef } from "react";
import { signed } from "@/lib/format";
import { hydration } from "@/lib/hydrated";

const DURATION = 600;

/** A signed figure that counts up from zero when it arrives through a navigation. */
export function CountUp({ value, places = 2 }: { value: number; places?: number }) {
  const ref = useRef<HTMLSpanElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el || !hydration.done || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const start = performance.now();
    let frame = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      const eased = 1 - (1 - t) ** 4;
      el.textContent = signed(value * eased, places);
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    el.textContent = signed(0, places);
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      el.textContent = signed(value, places);
    };
  }, [value, places]);

  return <span ref={ref}>{signed(value, places)}</span>;
}
