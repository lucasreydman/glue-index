import { ViewTransition } from "react";

const BY_TYPE = { "nav-forward": "nav-forward", "nav-back": "nav-back", default: "page" };

/**
 * Wraps a page's content so every navigation animates: a crossfade by default,
 * a short slide when stepping to the previous or next night or season.
 * `id` must change whenever the content does, including between two nights.
 */
export function Page({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <ViewTransition key={id} enter={BY_TYPE} exit={BY_TYPE} default="none">
      <div className="page">{children}</div>
    </ViewTransition>
  );
}
