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
        className={`-mb-px border-b-2 px-1 py-2 ${
          current
            ? "border-foreground font-medium"
            : "border-transparent text-foreground/60 hover:text-foreground"
        }`}
      >
        {label}
      </Link>
    );
  });
}
