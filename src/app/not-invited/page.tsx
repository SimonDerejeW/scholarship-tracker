import Link from "next/link";

export default function NotInvitedPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-4 px-4 py-12">
      <h1 className="text-2xl font-semibold">You&apos;re not invited yet</h1>
      <p className="text-foreground/70">
        This tracker is private to a small circle. Ask the Admin to add your email address,
        then sign in again.
      </p>
      <Link href="/sign-in" className="underline underline-offset-4">
        Sign in with a different account
      </Link>
    </main>
  );
}
