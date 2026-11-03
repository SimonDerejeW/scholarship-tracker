import { BackLink, PageLede, PageTitle } from "@/components/board";
import type { CatalogEntry } from "@/core";
import {
  addDeadline,
  addRequirement,
  editDeadline,
  editRequirement,
  removeDeadline,
  removeRequirement,
} from "@/server/catalog-actions";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { EditableList } from "./forms";
import { entryHref } from "./routes";

type Named = { name: string };

/** The page that edits a Programme's or Scholarship's Deadlines. */
export function DeadlinesEditor({
  entry,
  data,
}: {
  entry: CatalogEntry;
  data: Named & { deadlines: { id: number; label: string; date: string }[] };
}) {
  return (
    <>
      <ListPageHeader entry={entry} name={data.name} title="Deadlines">
        Dates only. If there&apos;s an exact cutoff time, put it in the label, e.g. &ldquo;Final,
        12:00 CET&rdquo;.
      </ListPageHeader>
      <EditableList
        rows={data.deadlines}
        fields={[
          { name: "label", label: "Label", required: true, placeholder: "e.g. Scholarship priority" },
          { name: "date", label: "Date", type: "date", required: true },
        ]}
        add={addDeadline.bind(null, entry)}
        edit={editDeadline}
        remove={removeDeadline}
        rowName="Deadline"
      />
    </>
  );
}

/** The page that edits a Programme's or Scholarship's Requirements, offering the Requirement pool. */
export async function RequirementsEditor({
  entry,
  data,
}: {
  entry: CatalogEntry;
  data: Named & { requirements: { id: number; label: string; note: string | null }[] };
}) {
  const member = await requireMember();
  const suggestions = await core.suggestRequirements(member.id, entry);

  return (
    <>
      <ListPageHeader entry={entry} name={data.name} title="Requirements">
        What applicants must provide, e.g. CV, two reference letters, IELTS ≥ 6.5.
      </ListPageHeader>
      <EditableList
        rows={data.requirements}
        fields={[
          { name: "label", label: "Requirement", required: true, placeholder: "e.g. CV" },
          { name: "note", label: "Note (optional)" },
        ]}
        add={addRequirement.bind(null, entry)}
        edit={editRequirement}
        remove={removeRequirement}
        suggestions={suggestions}
        rowName="Requirement"
      />
    </>
  );
}

function ListPageHeader({
  entry,
  name,
  title,
  children,
}: {
  entry: CatalogEntry;
  name: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <BackLink href={entryHref(entry)}>{name}</BackLink>
      <PageTitle className="mt-2">{title}</PageTitle>
      <PageLede>{children}</PageLede>
    </>
  );
}
