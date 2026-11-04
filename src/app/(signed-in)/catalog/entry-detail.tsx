import Link from "next/link";
import { ExternalLink, Pencil, Plus } from "lucide-react";
import { BoardColumns, BoardRows, boardRow, PageTitle, SectionHeading } from "@/components/board";
import { Button } from "@/components/ui/button";
import type { CatalogEntry } from "@/core";
import { deleteCatalogEntry } from "@/server/catalog-actions";
import { requireMember } from "@/server/session";
import { DateBlock } from "./date-block";
import { DeleteEntry } from "./delete-entry";
import { entryHref, KIND_NAMES } from "./routes";
import { Tracking } from "./tracking";

type Entry = {
  name: string;
  link: string | null;
  notes: string | null;
  addedBy: { id: string; name: string };
  deadlines: { id: number; label: string; date: string }[];
  requirements: { id: number; label: string; note: string | null }[];
};

/**
 * A Programme's or Scholarship's page: its name and kind, the kind's own
 * details (children), whether the Member is tracking it, then its link, notes, Deadlines and
 * Requirements.
 */
export function EntryDetail({
  entry,
  data,
  children,
}: {
  entry: CatalogEntry;
  data: Entry;
  children: React.ReactNode;
}) {
  const base = entryHref(entry);

  return (
    <article>
      <div className="mt-2 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="board-caps text-label font-semibold text-muted-foreground">
            {KIND_NAMES[entry.kind]}
          </p>
          <PageTitle entryName className="mt-1">
            {data.name}
          </PageTitle>
        </div>
        <Button asChild variant="outline" size="sm" className="mt-1 shrink-0">
          <Link href={`${base}/edit`}>
            <Pencil aria-hidden />
            Edit
          </Link>
        </Button>
      </div>
      {children}
      <Tracking entry={entry} />
      {data.link && (
        <p className="mt-4">
          <a
            href={data.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex max-w-full items-center gap-1.5 break-all underline decoration-edge transition-colors duration-150 hover:text-amber hover:decoration-amber"
          >
            {data.link}
            <ExternalLink className="size-4 shrink-0" aria-label="(opens in a new tab)" />
          </a>
        </p>
      )}
      {data.notes && <p className="mt-4 max-w-prose whitespace-pre-wrap">{data.notes}</p>}

      <Section title="Deadlines" editHref={`${base}/deadlines`} empty={!data.deadlines.length}>
        {data.deadlines.length === 0 ? (
          <Empty>No Deadlines yet. Add them once they&apos;re announced.</Empty>
        ) : (
          <>
            <BoardColumns className="flex gap-4">
              <span className="w-24 shrink-0">Date</span>
              <span>Deadline</span>
            </BoardColumns>
            <BoardRows>
              {data.deadlines.map((deadline) => (
                <li key={deadline.id} className={`${boardRow} flex items-baseline gap-4`}>
                  <DateBlock date={deadline.date} />
                  <span className="min-w-0">{deadline.label}</span>
                </li>
              ))}
            </BoardRows>
          </>
        )}
      </Section>

      <Section
        title="Requirements"
        editHref={`${base}/requirements`}
        empty={!data.requirements.length}
      >
        {data.requirements.length === 0 ? (
          <Empty>No Requirements yet. Pick common ones like CV or IELTS, or add your own.</Empty>
        ) : (
          <>
            <BoardColumns className={requirementColumns}>
              <span>Requirement</span>
              <span className="hidden sm:block">Note</span>
            </BoardColumns>
            <BoardRows>
              {data.requirements.map((requirement) => (
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

      <AddedBy entry={entry} addedBy={data.addedBy} />
    </article>
  );
}

/** Who added the entry; the Member who did is offered its delete. */
async function AddedBy({
  entry,
  addedBy,
}: {
  entry: CatalogEntry;
  addedBy: { id: string; name: string };
}) {
  const member = await requireMember();
  if (addedBy.id !== member.id) {
    return (
      <p className="mt-10 text-sm text-muted-foreground">
        Added by {addedBy.name}, the only Member who can delete it.
      </p>
    );
  }
  return (
    <div className="mt-10 flex flex-col gap-1">
      <p className="text-sm text-muted-foreground">Added by you</p>
      <DeleteEntry
        kindName={KIND_NAMES[entry.kind]}
        action={deleteCatalogEntry.bind(null, entry)}
      />
    </div>
  );
}

/** Requirements: label over note on a phone, two columns on desktop. */
const requirementColumns = "sm:grid sm:grid-cols-2 sm:gap-6";

function Section({
  title,
  editHref,
  empty,
  children,
}: {
  title: string;
  editHref: string;
  /** With nothing listed yet, the action reads Add rather than Edit. */
  empty: boolean;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <SectionHeading
        action={
          <Button asChild variant="outline" size="sm">
            <Link href={editHref}>
              {empty && <Plus aria-hidden />}
              {empty ? "Add" : "Edit"} <span className="sr-only">{title}</span>
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
