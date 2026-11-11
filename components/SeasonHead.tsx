import Link from "next/link";
import type { SeasonBoard, SiteIndex } from "@/lib/types";
import { SeasonNav } from "./Pickers";

export type SeasonView = "everyone" | "stars" | "value";

type Props = {
  board: SeasonBoard;
  index: SiteIndex;
  view: SeasonView;
  label: string;
  children: React.ReactNode;
};

const SUFFIX: Record<SeasonView, string> = { everyone: "", stars: "/stars", value: "/value" };

/** Title, season picker and the Everyone / Stars / Value switch shared by the three season views. */
export function SeasonHead({ board, index, view, label, children }: Props) {
  const views: { view: SeasonView; label: string }[] = [
    { view: "everyone", label: "Everyone" },
    { view: "stars", label: "Stars" },
  ];
  if (board.salariesAsOf) views.push({ view: "value", label: "Value" });

  return (
    <>
      <header className="page-head">
        <div>
          <p className="meta">{label}</p>
          <h1 className="page-title">
            {board.season} {board.inProgress && <span className="page-title-dim">in progress</span>}
          </h1>
          <p className="page-sub">{children}</p>
        </div>
        <SeasonNav
          season={board.season}
          seasons={view === "value" ? index.valueSeasons : index.seasons}
          suffix={SUFFIX[view]}
        />
      </header>
      <nav className="toggle views" aria-label="Season views">
        {views.map((v) => (
          <Link
            key={v.view}
            href={`/season/${board.season}${SUFFIX[v.view]}`}
            aria-current={v.view === view ? "page" : undefined}
          >
            {v.label}
          </Link>
        ))}
      </nav>
    </>
  );
}
