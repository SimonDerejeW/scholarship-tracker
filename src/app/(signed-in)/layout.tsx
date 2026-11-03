import Link from "next/link";
import { Suspense } from "react";
import { signOut } from "@/server/auth-actions";
import { requireMember } from "@/server/session";

export default function SignedInLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="border-b border-foreground/10">
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4 px-4 py-3">
          <Link href="/" className="shrink-0 font-semibold">
            Scholarship Tracker
          </Link>
          <Suspense>
            <MemberMenu />
          </Suspense>
        </div>
      </header>
      <main className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">{children}</main>
    </>
  );
}

async function MemberMenu() {
  const member = await requireMember();
  return (
    <form action={signOut} className="flex min-w-0 items-center gap-3 text-sm">
      <span className="truncate text-foreground/60">{member.email}</span>
      <button
        type="submit"
        className="shrink-0 rounded-md border border-foreground/20 px-3 py-1.5 hover:bg-foreground/5"
      >
        Sign out
      </button>
    </form>
  );
}
