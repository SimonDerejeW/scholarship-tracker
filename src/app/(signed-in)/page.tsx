import Link from "next/link";
import { Suspense } from "react";
import {
  BoardRows,
  boardRowLink,
  boardRowShell,
  EmptyBoard,
  Loading,
  PageTitle,
} from "@/components/board";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { KIND_NAMES } from "./catalog/routes";

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
  const member = await requireMember();
  const applications = await core.listApplications(member.id);

  if (applications.length === 0) {
    return (
      <div className="mt-6">
        <EmptyBoard title="Nothing to track yet">
          Start an Application from any Programme or Scholarship in the Catalog and it will appear
          here.
        </EmptyBoard>
      </div>
    );
  }
  return (
    <BoardRows className="mt-6 border-t border-rule">
      {applications.map((application) => (
        <li key={application.id} className={boardRowShell}>
          <Link
            href={`/applications/${application.id}`}
            className={`${boardRowLink} sm:flex sm:items-baseline sm:justify-between sm:gap-6`}
          >
            <span className="block min-w-0">
              <span className="block font-display text-entry font-semibold">
                {application.entry.name}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground">
                {KIND_NAMES[application.entry.kind]} · {application.entry.detail}
              </span>
            </span>
            <span className="mt-1 block shrink-0 board-caps text-label font-semibold sm:mt-0">
              {application.stage}
            </span>
          </Link>
        </li>
      ))}
    </BoardRows>
  );
}
