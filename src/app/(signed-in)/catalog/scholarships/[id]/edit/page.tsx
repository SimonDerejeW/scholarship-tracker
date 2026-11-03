import { Suspense } from "react";
import { BackLink, Loading, PageLede, PageTitle } from "@/components/board";
import { editScholarship } from "@/server/catalog-actions";
import { ScholarshipForm } from "../../../forms";
import { entryHref } from "../../../routes";
import { loadScholarship } from "../load";

export default function EditScholarshipPage({
  params,
}: PageProps<"/catalog/scholarships/[id]/edit">) {
  return (
    <Suspense fallback={<Loading />}>
      <EditScholarship params={params} />
    </Suspense>
  );
}

async function EditScholarship({
  params,
}: Pick<PageProps<"/catalog/scholarships/[id]/edit">, "params">) {
  const scholarship = await loadScholarship(params);

  return (
    <>
      <BackLink href={entryHref({ kind: "scholarship", id: scholarship.id })}>
        {scholarship.name}
      </BackLink>
      <PageTitle className="mt-2">Edit Scholarship</PageTitle>
      <PageLede>Changes are shared with everyone in the circle.</PageLede>
      <ScholarshipForm
        action={editScholarship.bind(null, scholarship.id)}
        scholarship={scholarship}
        submitLabel="Save"
      />
    </>
  );
}
