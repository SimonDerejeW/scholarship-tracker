import Link from "next/link";
import { Suspense } from "react";
import { editProgramme } from "@/server/catalog-actions";
import { ProgrammeForm } from "../../../forms";
import { loadProgramme } from "../load";

export default function EditProgrammePage({ params }: PageProps<"/catalog/programmes/[id]/edit">) {
  return (
    <Suspense fallback={<p className="text-foreground/60">Loading…</p>}>
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
      <Link
        href={`/catalog/programmes/${programme.id}`}
        className="text-sm text-foreground/60 hover:underline"
      >
        ← {programme.name}
      </Link>
      <h1 className="mt-2 text-2xl font-semibold">Edit Programme</h1>
      <p className="mt-1 text-foreground/60">Changes are shared with everyone in the circle.</p>
      <ProgrammeForm
        action={editProgramme.bind(null, programme.id)}
        programme={programme}
        submitLabel="Save"
      />
    </>
  );
}
