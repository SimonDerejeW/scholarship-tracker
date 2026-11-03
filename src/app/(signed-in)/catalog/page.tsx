import Link from "next/link";
import { Suspense } from "react";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { FundingIncluded } from "./funding-included";
import { primaryButtonClass } from "./styles";

export default function CatalogPage() {
  return (
    <>
      <div className="flex items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Catalog</h1>
        <Link href="/catalog/programmes/new" className={`${primaryButtonClass} shrink-0`}>
          Add Programme
        </Link>
      </div>
      <Suspense fallback={<p className="mt-4 text-foreground/60">Loading…</p>}>
        <Programmes />
      </Suspense>
    </>
  );
}

async function Programmes() {
  const member = await requireMember();
  const programmes = await core.listProgrammes(member.id);

  if (programmes.length === 0) {
    return (
      <div className="mt-6 rounded-lg border border-dashed border-foreground/20 p-6 text-center">
        <p className="font-medium">The Catalog is empty.</p>
        <p className="mt-1 text-sm text-foreground/60">
          Add a Programme you&apos;ve found so everyone in the circle can see it.
        </p>
      </div>
    );
  }

  return (
    <ul className="mt-6 flex flex-col gap-3">
      {programmes.map((programme) => (
        <li key={programme.id}>
          <Link
            href={`/catalog/programmes/${programme.id}`}
            className="block rounded-lg border border-foreground/10 p-4 hover:bg-foreground/5"
          >
            <span className="font-medium">{programme.name}</span>
            <span className="mt-1 block text-sm text-foreground/60">
              {[programme.university, programme.country].filter(Boolean).join(" · ")}
            </span>
            {programme.fundingIncluded && <FundingIncluded />}
          </Link>
        </li>
      ))}
    </ul>
  );
}
