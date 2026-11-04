import Link from "next/link";
import { Suspense } from "react";
import { Button } from "@/components/ui/button";
import { signOut } from "@/server/auth-actions";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { CurrentNavLinks, NavLinks } from "./nav-links";

export default function SignedInLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-rule">
        <div className="mx-auto flex max-w-board items-center justify-between gap-4 px-4 pt-3">
          <Link
            href="/"
            className="shrink-0 font-display text-lg font-bold tracking-[0.06em] uppercase"
          >
            Scholarship Tracker
          </Link>
          <Suspense>
            <MemberMenu />
          </Suspense>
        </div>
        <nav aria-label="Main" className="mx-auto mt-1 flex max-w-board gap-6 px-4">
          <Suspense fallback={<NavLinks />}>
            <MemberNavLinks />
          </Suspense>
        </nav>
      </header>
      <main className="mx-auto w-full max-w-board flex-1 px-4 pt-6 pb-16 sm:pt-8">{children}</main>
    </>
  );
}

async function MemberNavLinks() {
  const member = await requireMember();
  return <CurrentNavLinks isAdmin={await core.isAdmin(member.id)} />;
}

async function MemberMenu() {
  const member = await requireMember();
  return (
    <form action={signOut} className="-mr-3 flex min-w-0 items-center gap-1">
      <span className="truncate text-sm text-muted-foreground">{member.email}</span>
      <Button type="submit" variant="ghost" size="sm">
        Sign out
      </Button>
    </form>
  );
}
