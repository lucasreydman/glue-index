"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect } from "react";
import { hydration } from "@/lib/hydrated";

const LINKS = [
  { href: "/", label: "Nights", match: (p: string) => p === "/" || p.startsWith("/night") },
  { href: "/season", label: "Seasons", match: (p: string) => p.startsWith("/season") },
  { href: "/careers", label: "Careers", match: (p: string) => p.startsWith("/careers") || p.startsWith("/player") },
  { href: "/method", label: "Method", match: (p: string) => p.startsWith("/method") },
];

export function NavLinks() {
  const pathname = usePathname();
  useEffect(() => {
    hydration.done = true;
  }, []);
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className="nav-link" aria-current={l.match(pathname) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
