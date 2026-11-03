import { Suspense } from "react";
import { Loading } from "@/components/board";
import { DeadlinesEditor } from "../../../entry-lists";
import { loadProgramme } from "../load";

export default function DeadlinesPage({ params }: PageProps<"/catalog/programmes/[id]/deadlines">) {
  return (
    <Suspense fallback={<Loading />}>
      <Deadlines params={params} />
    </Suspense>
  );
}

async function Deadlines({
  params,
}: Pick<PageProps<"/catalog/programmes/[id]/deadlines">, "params">) {
  const programme = await loadProgramme(params);
  return <DeadlinesEditor entry={{ kind: "programme", id: programme.id }} data={programme} />;
}
