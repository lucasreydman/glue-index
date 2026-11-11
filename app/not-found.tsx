import Link from "next/link";

export default function NotFound() {
  return (
    <header className="page-head">
      <div>
        <p className="meta">404</p>
        <h1 className="page-title">Nothing on the books here</h1>
        <p className="page-sub">
          That night, season or player has not been scored. Start from the <Link href="/">latest night</Link> or the{" "}
          <Link href="/careers">career leaderboard</Link>
        </p>
      </div>
    </header>
  );
}
