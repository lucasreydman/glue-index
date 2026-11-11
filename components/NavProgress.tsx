"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

/** Fired by controls that navigate without a link, such as the night and season selects. */
export const NAVIGATE_EVENT = "glue:navigate";

/**
 * A thin line along the bottom of the header that starts the instant a navigation
 * is requested and completes when the new page is on screen. It answers every click
 * immediately, even when the destination takes a moment to arrive.
 */
export function NavProgress() {
  const pathname = usePathname();
  const bar = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const start = () => {
      if (bar.current) bar.current.dataset.state = "loading";
    };
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const link = (e.target as Element).closest("a");
      if (!link || link.target || link.origin !== window.location.origin) return;
      if (link.pathname === window.location.pathname) return;
      start();
    };
    document.addEventListener("click", onClick);
    window.addEventListener(NAVIGATE_EVENT, start);
    return () => {
      document.removeEventListener("click", onClick);
      window.removeEventListener(NAVIGATE_EVENT, start);
    };
  }, []);

  // The path changing means the new page has committed.
  useEffect(() => {
    const el = bar.current;
    if (!el || el.dataset.state !== "loading") return;
    el.dataset.state = "done";
    const timer = window.setTimeout(() => {
      el.dataset.state = "idle";
    }, 400);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return <div ref={bar} className="nav-progress" data-state="idle" aria-hidden="true" />;
}
