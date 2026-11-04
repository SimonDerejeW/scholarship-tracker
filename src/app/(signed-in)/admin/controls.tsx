"use client";

import { Plus, UserMinus, X } from "lucide-react";
import { useActionState, useId, type MouseEvent } from "react";
import { FormError } from "@/components/board";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { AllowlistFormState, RemoveMemberState } from "@/server/admin-actions";

export function AddToAllowlist({
  action,
}: {
  action: (state: AllowlistFormState, formData: FormData) => Promise<AllowlistFormState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});
  const id = useId();

  return (
    <form action={formAction} className="mt-4 flex max-w-form flex-col gap-2">
      <Label htmlFor={id}>Add an email</Label>
      <div className="flex gap-2">
        <Input
          id={id}
          name="email"
          type="email"
          required
          autoComplete="off"
          defaultValue={state.email ?? ""}
          placeholder="name@example.com"
        />
        <Button type="submit" disabled={pending}>
          <Plus aria-hidden />
          Add
        </Button>
      </div>
      <FormError error={state.error} />
    </form>
  );
}

export function RemoveFromAllowlist({
  email,
  action,
}: {
  email: string;
  action: () => Promise<void>;
}) {
  function confirmRemove(event: MouseEvent) {
    if (
      !confirm(
        `Take ${email} off the Allowlist? They'll be signed out and can't sign in again. Their Applications are kept.`,
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <form action={action} className="-my-3 -mr-4 shrink-0">
      <Button type="submit" variant="ghost" onClick={confirmRemove} aria-label={`Remove ${email}`}>
        <X aria-hidden />
        Remove
      </Button>
    </form>
  );
}

export function RemoveMember({
  name,
  action,
}: {
  name: string;
  action: () => Promise<RemoveMemberState>;
}) {
  const [state, formAction, pending] = useActionState(action, {});

  function confirmRemove(event: MouseEvent) {
    if (
      !confirm(
        `Remove ${name} from the circle? Their Applications, Checklist ticks and Personal items will be deleted, they'll be signed out and taken off the Allowlist. Catalog entries they added stay.`,
      )
    ) {
      event.preventDefault();
    }
  }

  return (
    <form action={formAction} className="-my-3 -mr-4 flex shrink-0 flex-col items-end">
      <Button
        type="submit"
        variant="ghost"
        disabled={pending}
        onClick={confirmRemove}
        aria-label={`Remove ${name}`}
      >
        <UserMinus aria-hidden />
        Remove
      </Button>
      <FormError error={state.error} className="mb-3" />
    </form>
  );
}
