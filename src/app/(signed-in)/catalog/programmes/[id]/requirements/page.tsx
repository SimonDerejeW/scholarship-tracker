import { Suspense } from "react";
import { addRequirement, editRequirement, removeRequirement } from "@/server/catalog-actions";
import { EditableList } from "../../../forms";
import { ListPageHeader } from "../list-page-header";
import { loadProgramme } from "../load";

export default function RequirementsPage({
  params,
}: PageProps<"/catalog/programmes/[id]/requirements">) {
  return (
    <Suspense fallback={<p className="text-foreground/60">Loading…</p>}>
      <Requirements params={params} />
    </Suspense>
  );
}

async function Requirements({
  params,
}: Pick<PageProps<"/catalog/programmes/[id]/requirements">, "params">) {
  const programme = await loadProgramme(params);

  return (
    <>
      <ListPageHeader programme={programme} title="Requirements">
        What applicants must provide, e.g. CV, two reference letters, IELTS ≥ 6.5.
      </ListPageHeader>
      <EditableList
        rows={programme.requirements}
        fields={[
          { name: "label", label: "Requirement", required: true, placeholder: "e.g. CV" },
          { name: "note", label: "Note (optional)" },
        ]}
        add={addRequirement.bind(null, programme.id)}
        edit={editRequirement}
        remove={removeRequirement}
        rowName="Requirement"
      />
    </>
  );
}
