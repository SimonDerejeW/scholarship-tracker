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
import { today } from "@/server/today";
import { CatalogSearch } from "./catalog-search";
import { DateBlock } from "./date-block";
import { FundingIncluded } from "./funding-included";
import { entryHref } from "./routes";

export default function CatalogPage({ searchParams }: PageProps<"/catalog">) {
  return (
    <>
      <PageTitle>Catalog</PageTitle>
      <Suspense fallback={<Loading />}>
        <Boards searchParams={searchParams} />
      </Suspense>
    </>
  );
}

async function Boards({ searchParams }: Pick<PageProps<"/catalog">, "searchParams">) {
  const member = await requireMember();
  const { q } = await searchParams;
  const query = (Array.isArray(q) ? q[0] : q)?.trim() ?? "";
  const { programmes, scholarships } = await core.searchCatalog(member.id, query, await today());
  const boards = [
    { id: "programmes", title: "Programmes", count: programmes.length },
    { id: "scholarships", title: "Scholarships", count: scholarships.length },
  ];

  return (
    <>
      <CatalogSearch query={query} />
      <nav aria-label="Boards" className="mt-1 flex gap-5 sm:hidden">
        {boards.map((board) => (
          <a
            key={board.id}
            href={`#${board.id}`}
            className="flex min-h-11 items-center gap-1.5 font-display text-base font-semibold tracking-[0.06em] uppercase underline decoration-edge underline-offset-4 transition-colors duration-150 hover:text-amber hover:decoration-amber"
          >
            {board.title}
            <span className="text-muted-foreground">{board.count}</span>
          </a>
        ))}
      </nav>
      <div className="mt-4 flex flex-col gap-10 sm:mt-6">
        <Board {...boards[0]} addHref="/catalog/programmes/new" addLabel="Add Programme">
          {programmes.length === 0 && query ? (
            <NoMatches query={query} />
          ) : programmes.length === 0 ? (
            <EmptyBoard title="No Programmes yet">
              Add a master&apos;s Programme you&apos;ve found so everyone in the circle can see it.
            </EmptyBoard>
          ) : (
            <Programmes programmes={programmes} />
          )}
        </Board>
        <Board {...boards[1]} addHref="/catalog/scholarships/new" addLabel="Add Scholarship">
          {scholarships.length === 0 && query ? (
            <NoMatches query={query} />
          ) : scholarships.length === 0 ? (
            <EmptyBoard title="No Scholarships yet">
              Add funding that&apos;s applied for separately from a Programme, like DAAD or
              Chevening.
            </EmptyBoard>
          ) : (
            <Scholarships scholarships={scholarships} />
          )}
        </Board>
      </div>
    </>
  );
}

/** A board with nothing matching the search. */
function NoMatches({ query }: { query: string }) {
  return (
    <EmptyBoard title="No matches">
      Nothing here matches &ldquo;{query}&rdquo;. Try fewer words, or add it.
    </EmptyBoard>
  );
}

function Board({
  id,
  title,
  count,
  addHref,
  addLabel,
  children,
}: {
  id: string;
  title: string;
  count: number;
  addHref: string;
  addLabel: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-4">
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
        {title} <span className="text-muted-foreground">{count}</span>
      </SectionHeading>
      {children}
    </section>
  );
}

type Found = Awaited<ReturnType<typeof core.searchCatalog>>;

type NextDeadline = { nextDeadline: { date: string } | null; deadlinesPassed: boolean };

/** A row's lead: its next Deadline's date, or why there is none to show. */
function NextDeadlineCell({ nextDeadline, deadlinesPassed }: NextDeadline) {
  if (nextDeadline) {
    return <DateBlock date={nextDeadline.date} />;
  }
  return (
    <span className="block w-24 shrink-0 font-display text-entry leading-tight font-semibold text-muted-foreground uppercase">
      {deadlinesPassed ? "Passed" : "TBA"}
    </span>
  );
}

/** Each row leads with its next Deadline; the rest is stacked on a phone, columns on desktop. */
const rowLayout = "flex items-baseline gap-4";

/** Desktop columns after the Deadline: Programme, University, Country. */
const programmeColumns =
  "sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,0.7fr)] sm:gap-6";

function Programmes({
  programmes,
}: {
  programmes: Found["programmes"];
}) {
  return (
    <>
      <BoardColumns className="hidden sm:flex sm:gap-4">
        <span className="w-24 shrink-0">Deadline</span>
        <span className={`flex-1 ${programmeColumns}`}>
          <span>Programme</span>
          <span>University</span>
          <span>Country</span>
        </span>
      </BoardColumns>
      <BoardRows className="border-t border-rule sm:border-t-0">
        {programmes.map((programme) => (
          <li key={programme.id} className={boardRowShell}>
            <Link
              href={entryHref({ kind: "programme", id: programme.id })}
              className={`${boardRowLink} ${rowLayout}`}
            >
              <NextDeadlineCell {...programme} />
              <span className={`block min-w-0 flex-1 ${programmeColumns}`}>
                <span className="block">
                  <span className="block font-display text-entry font-semibold">
                    {programme.name}
                  </span>
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
              </span>
            </Link>
          </li>
        ))}
      </BoardRows>
    </>
  );
}

/** Desktop columns after the Deadline: Scholarship, Provider, What it covers. */
const scholarshipColumns =
  "sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)_minmax(0,0.9fr)] sm:gap-6";

function Scholarships({
  scholarships,
}: {
  scholarships: Found["scholarships"];
}) {
  return (
    <>
      <BoardColumns className="hidden sm:flex sm:gap-4">
        <span className="w-24 shrink-0">Deadline</span>
        <span className={`flex-1 ${scholarshipColumns}`}>
          <span>Scholarship</span>
          <span>Provider</span>
          <span>Covers</span>
        </span>
      </BoardColumns>
      <BoardRows className="border-t border-rule sm:border-t-0">
        {scholarships.map((scholarship) => (
          <li key={scholarship.id} className={boardRowShell}>
            <Link
              href={entryHref({ kind: "scholarship", id: scholarship.id })}
              className={`${boardRowLink} ${rowLayout}`}
            >
              <NextDeadlineCell {...scholarship} />
              <span className={`block min-w-0 flex-1 ${scholarshipColumns}`}>
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
              </span>
            </Link>
          </li>
        ))}
      </BoardRows>
    </>
  );
}
