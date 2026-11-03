"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import type { Stage, StageFilter as Filter } from "@/core";

/** Picks which Stages Upcoming shows; the choice lives in the address as `?stage=`. */
export function StageFilter({ stages, value }: { stages: readonly Stage[]; value: Filter }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <NativeSelect
      aria-label="Show Stages"
      value={value}
      aria-busy={pending}
      onChange={(event) => {
        const stage = event.target.value;
        startTransition(() => router.push(stage === "open" ? "/" : `/?stage=${stage}`));
      }}
    >
      <NativeSelectOption value="open">Open Stages</NativeSelectOption>
      {stages.map((stage) => (
        <NativeSelectOption key={stage} value={stage}>
          {stage}
        </NativeSelectOption>
      ))}
      <NativeSelectOption value="all">All Stages</NativeSelectOption>
    </NativeSelect>
  );
}
