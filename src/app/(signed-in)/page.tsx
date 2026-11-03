import { Suspense } from "react";
import { requireMember } from "@/server/session";

export default function UpcomingPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Upcoming</h1>
      <Suspense fallback={<p className="mt-4 text-foreground/60">Loading…</p>}>
        <Upcoming />
      </Suspense>
    </>
  );
}

async function Upcoming() {
  await requireMember();
  return (
    <div className="mt-6 rounded-lg border border-dashed border-foreground/20 p-6 text-center">
      <p className="font-medium">Nothing to track yet.</p>
      <p className="mt-1 text-sm text-foreground/60">
        Applications you start will appear here, ordered by their next Deadline.
      </p>
    </div>
  );
}
