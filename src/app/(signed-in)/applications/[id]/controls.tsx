"use client";

import { Check, Trash2 } from "lucide-react";
import { useActionState, useId, useOptimistic, useTransition, type MouseEvent } from "react";
import { FormError } from "@/components/board";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { Stage } from "@/core";
import type { NotesState } from "@/server/application-actions";

/** Every Stage as a button; tapping one moves the Application there straight away. */
export function StagePicker({
  stages,
  stage,
  setStage,
}: {
  stages: readonly Stage[];
  stage: Stage;
  setStage: (stage: Stage) => Promise<void>;
}) {
  const [shown, setShown] = useOptimistic(stage);
  const [, startTransition] = useTransition();

  function pick(next: Stage) {
    startTransition(async () => {
      setShown(next);
      await setStage(next);
    });
  }

  return (
    <div role="group" aria-label="Stage" className="mt-4 flex flex-wrap gap-2">
      {stages.map((option) => {
        const current = option === shown;
        return (
          <Button
            key={option}
            type="button"
            variant="outline"
            aria-pressed={current}
            onClick={() => !current && pick(option)}
            className={cn(
              "px-3",
              current
                ? "border-foreground bg-band-hover"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {current && <Check aria-hidden />}
            {option}
          </Button>
        );
      })}
    </div>
  );
}

/** The Member's own notes on an Application. */
export function NotesForm({
  notes,
  action,
}: {
  notes: string | null;
  action: (state: NotesState, formData: FormData) => Promise<NotesState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const id = useId();

  return (
    <form action={formAction} className="mt-4 flex max-w-form flex-col gap-3">
      <Label htmlFor={id} className="sr-only">
        Notes
      </Label>
      <Textarea
        id={id}
        name="notes"
        rows={5}
        defaultValue={notes ?? ""}
        aria-describedby={`${id}-hint`}
        placeholder="e.g. portal login hints, who you spoke to"
      />
      <p id={`${id}-hint`} className="text-sm text-muted-foreground">
        Only you can see your Application and its notes.
      </p>
      <FormError error={state.error} />
      <div className="flex items-center gap-4">
        <Button type="submit" variant="outline" disabled={pending}>
          Save notes
        </Button>
        {state.saved && !pending && (
          <p role="status" className="text-sm text-muted-foreground">
            Saved
          </p>
        )}
      </div>
    </form>
  );
}

/** Deletes the Application after the Member confirms. */
export function DeleteApplication({ action }: { action: () => Promise<void> }) {
  function confirmDelete(event: MouseEvent) {
    if (!confirm("Delete this Application? Its Stage, Checklist ticks, Personal items and notes will be lost.")) {
      event.preventDefault();
    }
  }

  return (
    <form action={action}>
      <Button type="submit" variant="ghost" onClick={confirmDelete} className="-ml-5">
        <Trash2 aria-hidden />
        Delete Application
      </Button>
    </form>
  );
}
