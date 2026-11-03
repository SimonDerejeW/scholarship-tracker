import { Suspense } from "react";
import { Loading } from "@/components/board";
import { DeadlinesEditor } from "../../../entry-lists";
import { loadScholarship } from "../load";

export default function DeadlinesPage({ params }: PageProps<"/catalog/scholarships/[id]/deadlines">) {
  return (
    <Suspense fallback={<Loading />}>
      <Deadlines params={params} />
    </Suspense>
  );
}

async function Deadlines({
  params,
}: Pick<PageProps<"/catalog/scholarships/[id]/deadlines">, "params">) {
  const scholarship = await loadScholarship(params);
  return <DeadlinesEditor entry={{ kind: "scholarship", id: scholarship.id }} data={scholarship} />;
}
