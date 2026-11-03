import { Suspense } from "react";
import { BackLink, Loading } from "@/components/board";
import { EntryDetail } from "../../entry-detail";
import { loadScholarship } from "./load";

export default function ScholarshipPage({ params }: PageProps<"/catalog/scholarships/[id]">) {
  return (
    <>
      <BackLink href="/catalog">Catalog</BackLink>
      <Suspense fallback={<Loading />}>
        <Scholarship params={params} />
      </Suspense>
    </>
  );
}

async function Scholarship({ params }: Pick<PageProps<"/catalog/scholarships/[id]">, "params">) {
  const scholarship = await loadScholarship(params);

  return (
    <EntryDetail entry={{ kind: "scholarship", id: scholarship.id }} data={scholarship}>
      <p className="mt-2 text-lg">{scholarship.provider}</p>
      {scholarship.coverage && (
        <p className="mt-3 max-w-prose">
          <span className="mr-2 font-display text-label font-semibold tracking-[0.06em] text-muted-foreground uppercase">
            Covers
          </span>
          {scholarship.coverage}
        </p>
      )}
    </EntryDetail>
  );
}
