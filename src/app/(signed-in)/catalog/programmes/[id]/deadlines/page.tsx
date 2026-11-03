import { Suspense } from "react";
import { addDeadline, editDeadline, removeDeadline } from "@/server/catalog-actions";
import { EditableList } from "../../../forms";
import { ListPageHeader } from "../list-page-header";
import { loadProgramme } from "../load";

export default function DeadlinesPage({ params }: PageProps<"/catalog/programmes/[id]/deadlines">) {
  return (
    <Suspense fallback={<p className="text-foreground/60">Loading…</p>}>
      <Deadlines params={params} />
    </Suspense>
  );
}

async function Deadlines({
  params,
}: Pick<PageProps<"/catalog/programmes/[id]/deadlines">, "params">) {
  const programme = await loadProgramme(params);

  return (
    <>
      <ListPageHeader programme={programme} title="Deadlines">
        Dates only. If there&apos;s an exact cutoff time, put it in the label, e.g. &ldquo;Final,
        12:00 CET&rdquo;.
      </ListPageHeader>
      <EditableList
        rows={programme.deadlines}
        fields={[
          { name: "label", label: "Label", required: true, placeholder: "e.g. Scholarship priority" },
          { name: "date", label: "Date", type: "date", required: true },
        ]}
        add={addDeadline.bind(null, programme.id)}
        edit={editDeadline}
        remove={removeDeadline}
        rowName="Deadline"
      />
    </>
  );
}
