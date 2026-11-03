import { Suspense } from "react";
import { BackLink, Loading, PageLede, PageTitle } from "@/components/board";
import { editProgramme } from "@/server/catalog-actions";
import { ProgrammeForm } from "../../../forms";
import { loadProgramme } from "../load";

export default function EditProgrammePage({ params }: PageProps<"/catalog/programmes/[id]/edit">) {
  return (
    <Suspense fallback={<Loading />}>
      <EditProgramme params={params} />
    </Suspense>
  );
}

async function EditProgramme({
  params,
}: Pick<PageProps<"/catalog/programmes/[id]/edit">, "params">) {
  const programme = await loadProgramme(params);

  return (
    <>
      <BackLink href={`/catalog/programmes/${programme.id}`}>{programme.name}</BackLink>
      <PageTitle className="mt-2">Edit Programme</PageTitle>
      <PageLede>Changes are shared with everyone in the circle.</PageLede>
      <ProgrammeForm
        action={editProgramme.bind(null, programme.id)}
        programme={programme}
        submitLabel="Save"
      />
    </>
  );
}
