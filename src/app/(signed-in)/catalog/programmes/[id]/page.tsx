import { Suspense } from "react";
import { BackLink, Loading } from "@/components/board";
import { EntryDetail } from "../../entry-detail";
import { FundingIncluded } from "../../funding-included";
import { loadProgramme } from "./load";

export default function ProgrammePage({ params }: PageProps<"/catalog/programmes/[id]">) {
  return (
    <>
      <BackLink href="/catalog">Catalog</BackLink>
      <Suspense fallback={<Loading />}>
        <Programme params={params} />
      </Suspense>
    </>
  );
}

async function Programme({ params }: Pick<PageProps<"/catalog/programmes/[id]">, "params">) {
  const programme = await loadProgramme(params);

  return (
    <EntryDetail entry={{ kind: "programme", id: programme.id }} data={programme}>
      <p className="mt-2 text-lg">
        {programme.university}
        {programme.country && <span className="text-muted-foreground"> · {programme.country}</span>}
      </p>
      {programme.fundingIncluded && (
        <p className="mt-3">
          <FundingIncluded />
        </p>
      )}
    </EntryDetail>
  );
}
