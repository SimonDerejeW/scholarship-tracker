import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import {
  BoardColumns,
  BoardRows,
  boardRowLink,
  boardRowShell,
  EmptyBoard,
  Loading,
  PageTitle,
  SectionHeading,
} from "@/components/board";
import { Button } from "@/components/ui/button";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { FundingIncluded } from "./funding-included";
import { entryHref } from "./routes";

export default function CatalogPage() {
  return (
    <>
      <PageTitle>Catalog</PageTitle>
      <Suspense fallback={<Loading />}>
        <Boards />
      </Suspense>
    </>
  );
}

async function Boards() {
  const member = await requireMember();
  const [programmes, scholarships] = await Promise.all([
    core.listProgrammes(member.id),
    core.listScholarships(member.id),
  ]);

  return (
    <div className="mt-6 flex flex-col gap-10">
      <Board title="Programmes" addHref="/catalog/programmes/new" addLabel="Add Programme">
        {programmes.length === 0 ? (
          <EmptyBoard title="No Programmes yet">
            Add a master&apos;s Programme you&apos;ve found so everyone in the circle can see it.
          </EmptyBoard>
        ) : (
          <Programmes programmes={programmes} />
        )}
      </Board>
      <Board title="Scholarships" addHref="/catalog/scholarships/new" addLabel="Add Scholarship">
        {scholarships.length === 0 ? (
          <EmptyBoard title="No Scholarships yet">
            Add funding that&apos;s applied for separately from a Programme, like DAAD or Chevening.
          </EmptyBoard>
        ) : (
          <Scholarships scholarships={scholarships} />
        )}
      </Board>
    </div>
  );
}

function Board({
  title,
  addHref,
  addLabel,
  children,
}: {
  title: string;
  addHref: string;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <SectionHeading
        action={
          <Button asChild variant="outline" size="sm" className="shrink-0">
            <Link href={addHref}>
              <Plus aria-hidden />
              {addLabel}
            </Link>
          </Button>
        }
      >
        {title}
      </SectionHeading>
      {children}
    </section>
  );
}

/** Desktop columns: Programme, University, Country. */
const programmeColumns =
  "sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,0.7fr)] sm:gap-6";

function Programmes({
  programmes,
}: {
  programmes: Awaited<ReturnType<typeof core.listProgrammes>>;
}) {
  return (
    <>
      <BoardColumns className={programmeColumns}>
        <span>Programme</span>
        <span className="hidden sm:block">University</span>
        <span className="hidden sm:block">Country</span>
      </BoardColumns>
      <BoardRows>
        {programmes.map((programme) => (
          <li key={programme.id} className={boardRowShell}>
            <Link
              href={entryHref({ kind: "programme", id: programme.id })}
              className={`${boardRowLink} ${programmeColumns}`}
            >
              <span className="block">
                <span className="block font-display text-entry font-semibold">{programme.name}</span>
                {programme.fundingIncluded && (
                  <span className="mt-1.5 block">
                    <FundingIncluded />
                  </span>
                )}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground sm:mt-0 sm:pt-px sm:text-base sm:text-foreground">
                {programme.university}
                {programme.country && <span className="sm:hidden"> · {programme.country}</span>}
              </span>
              <span className="hidden pt-px text-muted-foreground sm:block">
                {programme.country}
              </span>
            </Link>
          </li>
        ))}
      </BoardRows>
    </>
  );
}

/** Desktop columns: Scholarship, Provider, What it covers. */
const scholarshipColumns =
  "sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)] sm:gap-6";

function Scholarships({
  scholarships,
}: {
  scholarships: Awaited<ReturnType<typeof core.listScholarships>>;
}) {
  return (
    <>
      <BoardColumns className={scholarshipColumns}>
        <span>Scholarship</span>
        <span className="hidden sm:block">Provider</span>
        <span className="hidden sm:block">Covers</span>
      </BoardColumns>
      <BoardRows>
        {scholarships.map((scholarship) => (
          <li key={scholarship.id} className={boardRowShell}>
            <Link
              href={entryHref({ kind: "scholarship", id: scholarship.id })}
              className={`${boardRowLink} ${scholarshipColumns}`}
            >
              <span className="block font-display text-entry font-semibold">
                {scholarship.name}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground sm:mt-0 sm:pt-px sm:text-base sm:text-foreground">
                {scholarship.provider}
              </span>
              {scholarship.coverage && (
                <span className="mt-0.5 line-clamp-2 text-sm text-muted-foreground sm:mt-0 sm:pt-px sm:text-base">
                  {scholarship.coverage}
                </span>
              )}
            </Link>
          </li>
        ))}
      </BoardRows>
    </>
  );
}
