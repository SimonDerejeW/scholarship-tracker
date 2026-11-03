"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Upcoming" },
  { href: "/catalog", label: "Catalog" },
];

/** The main navigation, marking the current area. */
export function CurrentNavLinks() {
  return <NavLinks pathname={usePathname()} />;
}

/** The main navigation; with no pathname, nothing is marked current. */
export function NavLinks({ pathname }: { pathname?: string }) {
  return LINKS.map(({ href, label }) => {
    const current = href === "/" ? pathname === "/" : pathname?.startsWith(href);
    return (
      <Link
        key={href}
        href={href}
        aria-current={current ? "page" : undefined}
        className={`-mb-px flex min-h-11 items-center border-b-[3px] font-display text-base font-semibold tracking-[0.06em] uppercase transition-colors duration-150 ${
          current
            ? "border-amber text-amber"
            : "border-transparent text-muted-foreground hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  });
}
