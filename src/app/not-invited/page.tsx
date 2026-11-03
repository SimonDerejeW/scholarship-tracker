import Link from "next/link";
import { PageLede, PageTitle } from "@/components/board";
import { Button } from "@/components/ui/button";

export default function NotInvitedPage() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-4 py-12">
      <PageTitle>You&apos;re not invited yet</PageTitle>
      <PageLede>
        This tracker is private to a small circle. Ask the Admin to add your email address, then
        sign in again.
      </PageLede>
      <Button asChild variant="outline" className="mt-8 self-start">
        <Link href="/sign-in">Sign in with a different account</Link>
      </Button>
    </main>
  );
}
