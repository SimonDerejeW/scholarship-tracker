import { Suspense } from "react";
import { Loading } from "@/components/board";
import { addRequirement, editRequirement, removeRequirement } from "@/server/catalog-actions";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { EditableList } from "../../../forms";
import { ListPageHeader } from "../list-page-header";
import { loadProgramme } from "../load";

export default function RequirementsPage({
  params,
}: PageProps<"/catalog/programmes/[id]/requirements">) {
  return (
    <Suspense fallback={<Loading />}>
      <Requirements params={params} />
    </Suspense>
  );
}

async function Requirements({
  params,
}: Pick<PageProps<"/catalog/programmes/[id]/requirements">, "params">) {
  const programme = await loadProgramme(params);
  const member = await requireMember();
  const suggestions = await core.suggestRequirements(member.id, programme.id);

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
        suggestions={suggestions}
        rowName="Requirement"
      />
    </>
  );
}
