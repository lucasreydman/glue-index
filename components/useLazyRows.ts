"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Renders a long table a screenful at a time. Only `limit` rows are in the page;
 * more are added shortly before the reader scrolls to the end of them.
 */
export function useLazyRows(total: number, step = 40) {
  const [limit, setLimit] = useState(step);
  const sentinel = useRef<HTMLDivElement>(null);
  const more = limit < total;

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !more) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) setLimit((l) => l + step);
      },
      { rootMargin: "600px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [limit, more, step]);

  return { limit, more, sentinel };
}
