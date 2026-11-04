"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Upcoming" },
  { href: "/catalog", label: "Catalog" },
];

/** Only the Admin sees this one. */
const ADMIN_LINK = { href: "/admin", label: "Admin" };

/** The main navigation, marking the current area. */
export function CurrentNavLinks({ isAdmin }: { isAdmin: boolean }) {
  return <NavLinks pathname={usePathname()} isAdmin={isAdmin} />;
}

/** The main navigation; with no pathname, nothing is marked current. */
export function NavLinks({ pathname, isAdmin = false }: { pathname?: string; isAdmin?: boolean }) {
  return (isAdmin ? [...LINKS, ADMIN_LINK] : LINKS).map(({ href, label }) => {
    // Applications live under Upcoming.
    const current =
      href === "/"
        ? pathname === "/" || pathname?.startsWith("/applications/")
        : pathname?.startsWith(href);
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
