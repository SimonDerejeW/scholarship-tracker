import { Suspense } from "react";
import { Loading } from "@/components/board";
import { RequirementsEditor } from "../../../entry-lists";
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
  return <RequirementsEditor entry={{ kind: "programme", id: programme.id }} data={programme} />;
}
