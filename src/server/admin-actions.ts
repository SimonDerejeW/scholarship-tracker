"use server";

import { revalidatePath } from "next/cache";
import { InvalidInputError, NotAllowedError, NotFoundError } from "@/core";
import { core } from "./core";
import { requireMember } from "./session";

/** What the add-email form shows after submitting: a refusal, with what was typed. */
export type AllowlistFormState = { error?: string; email?: string };

/** Why removing a Member was refused, if it was. */
export type RemoveMemberState = { error?: string };

export async function addToAllowlist(
  _state: AllowlistFormState,
  formData: FormData,
): Promise<AllowlistFormState> {
  const member = await requireMember();
  const value = formData.get("email");
  const email = typeof value === "string" ? value : "";
  try {
    await core.addToAllowlist(member.id, email);
  } catch (error) {
    if (error instanceof InvalidInputError) {
      return { error: error.message, email };
    }
    throw error;
  }
  revalidatePath("/admin");
  return {};
}

export async function removeFromAllowlist(email: string): Promise<void> {
  const member = await requireMember();
  await core.removeFromAllowlist(member.id, email);
  revalidatePath("/admin");
}

/** Removes a Member; a refusal (say, they were removed already) comes back as a message. */
export async function removeMember(memberId: string): Promise<RemoveMemberState> {
  const member = await requireMember();
  try {
    await core.removeMember(member.id, memberId);
  } catch (error) {
    if (error instanceof NotAllowedError || error instanceof NotFoundError) {
      return { error: error.message };
    }
    throw error;
  }
  revalidatePath("/admin");
  return {};
}
