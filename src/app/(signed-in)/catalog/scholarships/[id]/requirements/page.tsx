import { Suspense } from "react";
import { Loading } from "@/components/board";
import { RequirementsEditor } from "../../../entry-lists";
import { loadScholarship } from "../load";

export default function RequirementsPage({
  params,
}: PageProps<"/catalog/scholarships/[id]/requirements">) {
  return (
    <Suspense fallback={<Loading />}>
      <Requirements params={params} />
    </Suspense>
  );
}

async function Requirements({
  params,
}: Pick<PageProps<"/catalog/scholarships/[id]/requirements">, "params">) {
  const scholarship = await loadScholarship(params);
  return (
    <RequirementsEditor entry={{ kind: "scholarship", id: scholarship.id }} data={scholarship} />
  );
}
