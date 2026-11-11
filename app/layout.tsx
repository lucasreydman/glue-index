import type { Metadata } from "next";
import { Sofia_Sans, Sofia_Sans_Extra_Condensed, Sometype_Mono } from "next/font/google";
import Link from "next/link";
import { NavLinks } from "@/components/NavLinks";
import { NavProgress } from "@/components/NavProgress";
import { getIndex } from "@/lib/data";
import { ACRONYM } from "@/lib/formula";
import "./globals.css";

const sans = Sofia_Sans({ subsets: ["latin"], variable: "--font-sans" });
const display = Sofia_Sans_Extra_Condensed({ subsets: ["latin"], variable: "--font-display" });
const mono = Sometype_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
  title: { default: "GLUE Index", template: "%s · GLUE Index" },
  description:
    "GLUE (Grit Less Usage & Errors) ranks NBA players by the possessions they win and the mistakes they avoid. Scored every night, every season since 2005-06.",
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const index = await getIndex();
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${mono.variable}`}>
      <body>
        <a className="skip" href="#main">
          Skip to content
        </a>
        <header className="site-header" style={{ viewTransitionName: "site-header" }}>
          <div className="wrap site-header-inner">
            <Link href="/" className="brand" aria-label="GLUE Index home">
              <svg className="brand-mark" viewBox="0 0 20 20" aria-hidden="true">
                <rect x="10" y="2" width="9" height="4" className="mark-credit" />
                <rect x="10" y="8" width="5" height="4" className="mark-credit" />
                <rect x="3" y="14" width="7" height="4" className="mark-debit" />
              </svg>
              <span className="brand-name">GLUE</span>
              <span className="brand-sub">{ACRONYM}</span>
            </Link>
            <NavLinks season={index.seasons[0]} />
          </div>
          <NavProgress />
        </header>
        <main id="main" className="wrap main">
          {children}
        </main>
        <footer className="wrap site-footer">
          <p>
            Play-by-play data from <a href="https://www.pbpstats.com">pbpstats.com</a>. Regular season only. Not
            affiliated with the NBA.
          </p>
          <p>
            <Link href="/method">How GLUE is calculated</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
