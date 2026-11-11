import type { Metadata } from "next";
import { CareerTable } from "@/components/CareerTable";
import { getCareers, getIndex } from "@/lib/data";
import { count } from "@/lib/format";

export const metadata: Metadata = { title: "Careers" };

export default async function CareersPage() {
  const [careers, index] = await Promise.all([getCareers(), getIndex()]);
  const { first, last } = index.careerSeasons;

  return (
    <>
      <header className="page-head">
        <div>
          <p className="meta">Career leaderboard</p>
          <h1 className="page-title">
            Careers <span className="page-title-dim">since {first}</span>
          </h1>
          <p className="page-sub">
            {count(careers.length)} players · the sum of every completed, qualified season from {first} to {last}.
            Play-by-play did not track fouls drawn before {first}, so earlier seasons cannot be scored
          </p>
        </div>
      </header>
      <CareerTable rows={careers} />
    </>
  );
}
