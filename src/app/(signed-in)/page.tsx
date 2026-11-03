import { Suspense } from "react";
import { EmptyBoard, Loading, PageTitle } from "@/components/board";
import { requireMember } from "@/server/session";

export default function UpcomingPage() {
  return (
    <>
      <PageTitle>Upcoming</PageTitle>
      <Suspense fallback={<Loading />}>
        <Upcoming />
      </Suspense>
    </>
  );
}

async function Upcoming() {
  await requireMember();
  return (
    <div className="mt-6">
      <EmptyBoard title="Nothing to track yet">
        Applications you start will appear here, ordered by their next Deadline.
      </EmptyBoard>
    </div>
  );
}
