import Link from "next/link";
import { Plus } from "lucide-react";
import { Suspense } from "react";
import {
  BoardColumns,
  BoardRows,
  boardRowLink,
  boardRowShell,
  EmptyBoard,
  Loading,
  PageTitle,
} from "@/components/board";
import { Button } from "@/components/ui/button";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";
import { FundingIncluded } from "./funding-included";

export default function CatalogPage() {
  return (
    <>
      <div className="flex items-end justify-between gap-4">
        <PageTitle>Catalog</PageTitle>
        <Button asChild className="shrink-0">
          <Link href="/catalog/programmes/new">
            <Plus aria-hidden />
            Add Programme
          </Link>
        </Button>
      </div>
      <Suspense fallback={<Loading />}>
        <Programmes />
      </Suspense>
    </>
  );
}

/** Desktop columns: Programme, University, Country. */
const columns = "sm:grid sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1.2fr)_minmax(0,0.7fr)] sm:gap-6";

async function Programmes() {
  const member = await requireMember();
  const programmes = await core.listProgrammes(member.id);

  if (programmes.length === 0) {
    return (
      <div className="mt-6">
        <EmptyBoard title="The Catalog is empty">
          Add a Programme you&apos;ve found so everyone in the circle can see it.
        </EmptyBoard>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <BoardColumns className={columns}>
        <span>Programme</span>
        <span className="hidden sm:block">University</span>
        <span className="hidden sm:block">Country</span>
      </BoardColumns>
      <BoardRows>
        {programmes.map((programme) => (
          <li key={programme.id} className={boardRowShell}>
            <Link href={`/catalog/programmes/${programme.id}`} className={`${boardRowLink} ${columns}`}>
              <span className="block">
                <span className="block font-display text-entry font-semibold">{programme.name}</span>
                {programme.fundingIncluded && (
                  <span className="mt-1.5 block">
                    <FundingIncluded />
                  </span>
                )}
              </span>
              <span className="mt-1 block text-sm text-muted-foreground sm:mt-0 sm:pt-px sm:text-base sm:text-foreground">
                {programme.university}
                {programme.country && <span className="sm:hidden"> · {programme.country}</span>}
              </span>
              <span className="hidden pt-px text-muted-foreground sm:block">
                {programme.country}
              </span>
            </Link>
          </li>
        ))}
      </BoardRows>
    </div>
  );
}
