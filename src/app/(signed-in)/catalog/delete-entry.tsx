"use client";

import { Trash2 } from "lucide-react";
import { useActionState, type MouseEvent } from "react";
import { FormError } from "@/components/board";
import { Button } from "@/components/ui/button";
import type { FormState } from "@/server/catalog-actions";

/**
 * Deletes a Programme or Scholarship after the Member confirms. A refusal, such as someone
 * having an Application to it, is shown under the button.
 */
export function DeleteEntry({
  kindName,
  action,
}: {
  kindName: string;
  action: (state: FormState) => Promise<FormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  function confirmDelete(event: MouseEvent) {
    if (
      !confirm(
        `Delete this ${kindName} for everyone? Its Deadlines and Requirements will be deleted too.`,
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className="flex flex-col items-start gap-2">
      <Button
        type="submit"
        variant="ghost"
        disabled={pending}
        onClick={confirmDelete}
        className="-ml-5"
      >
        <Trash2 aria-hidden />
        Delete {kindName}
      </Button>
      <FormError error={state.error} />
    </form>
  );
}
