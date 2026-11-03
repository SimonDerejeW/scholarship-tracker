import Link from "next/link";
import { ExternalLink, Pencil } from "lucide-react";
import { Suspense } from "react";
import {
  BackLink,
  BoardColumns,
  BoardRows,
  boardRow,
  Loading,
  PageTitle,
  SectionHeading,
} from "@/components/board";
import { Button } from "@/components/ui/button";
import { FundingIncluded } from "../../funding-included";
import { dateParts } from "../../format";
import { loadProgramme } from "./load";

export default function ProgrammePage({ params }: PageProps<"/catalog/programmes/[id]">) {
  return (
    <>
      <BackLink href="/catalog">Catalog</BackLink>
      <Suspense fallback={<Loading />}>
        <Programme params={params} />
      </Suspense>
    </>
  );
}

async function Programme({ params }: Pick<PageProps<"/catalog/programmes/[id]">, "params">) {
  const programme = await loadProgramme(params);
  const base = `/catalog/programmes/${programme.id}`;

  return (
    <article>
      <div className="mt-2 flex items-start justify-between gap-4">
        <PageTitle entryName>{programme.name}</PageTitle>
        <Button asChild variant="outline" size="sm" className="mt-1">
          <Link href={`${base}/edit`}>
            <Pencil aria-hidden />
            Edit
          </Link>
        </Button>
      </div>
      <p className="mt-2 text-lg">
        {programme.university}
        {programme.country && <span className="text-muted-foreground"> · {programme.country}</span>}
      </p>
      {programme.fundingIncluded && (
        <p className="mt-3">
          <FundingIncluded />
        </p>
      )}
      {programme.link && (
        <p className="mt-4">
          <a
            href={programme.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 break-all underline decoration-edge transition-colors duration-150 hover:text-amber hover:decoration-amber"
          >
            {programme.link}
            <ExternalLink className="size-4 shrink-0" aria-label="(opens in a new tab)" />
          </a>
        </p>
      )}
      {programme.notes && <p className="mt-4 max-w-prose whitespace-pre-wrap">{programme.notes}</p>}

      <Section title="Deadlines" editHref={`${base}/deadlines`}>
        {programme.deadlines.length === 0 ? (
          <Empty>No Deadlines yet. Add them once they&apos;re announced.</Empty>
        ) : (
          <>
            <BoardColumns className="flex gap-4">
              <span className="w-24 shrink-0">Date</span>
              <span>Deadline</span>
            </BoardColumns>
            <BoardRows>
              {programme.deadlines.map((deadline) => {
                const date = dateParts(deadline.date);
                return (
                  <li key={deadline.id} className={`${boardRow} flex items-baseline gap-4`}>
                    <time
                      dateTime={deadline.date}
                      className="w-24 shrink-0 font-display leading-tight"
                    >
                      <span className="block text-entry font-semibold text-amber uppercase">
                        {date.dayMonth}
                      </span>
                      <span className="block text-label tracking-[0.06em] text-muted-foreground uppercase">
                        {date.weekday} {date.year}
                      </span>
                    </time>
                    <span className="min-w-0">{deadline.label}</span>
                  </li>
                );
              })}
            </BoardRows>
          </>
        )}
      </Section>

      <Section title="Requirements" editHref={`${base}/requirements`}>
        {programme.requirements.length === 0 ? (
          <Empty>No Requirements yet.</Empty>
        ) : (
          <>
            <BoardColumns className={requirementColumns}>
              <span>Requirement</span>
              <span className="hidden sm:block">Note</span>
            </BoardColumns>
            <BoardRows>
              {programme.requirements.map((requirement) => (
                <li key={requirement.id} className={`${boardRow} ${requirementColumns}`}>
                  <span className="block font-medium">{requirement.label}</span>
                  {requirement.note && (
                    <span className="block text-sm text-muted-foreground sm:text-base">
                      {requirement.note}
                    </span>
                  )}
                </li>
              ))}
            </BoardRows>
          </>
        )}
      </Section>

      <p className="mt-10 text-sm text-muted-foreground">Added by {programme.addedBy.name}</p>
    </article>
  );
}

/** Requirements: label over note on a phone, two columns on desktop. */
const requirementColumns = "sm:grid sm:grid-cols-2 sm:gap-6";

function Section({
  title,
  editHref,
  children,
}: {
  title: string;
  editHref: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <SectionHeading
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={editHref}>
              Edit <span className="sr-only">{title}</span>
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

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-4 text-muted-foreground">{children}</p>;
}
