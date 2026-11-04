"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InvalidInputError, NotFoundError, type CatalogEntry } from "@/core";
import { core } from "./core";
import { requireMember } from "./session";

/** What the notes form shows after saving. */
export type NotesState = { error?: string; saved?: boolean };

/** What a Personal item form shows after submitting: a rule broken, with what was typed. */
export type PersonalItemState = { error?: string; label?: string };

/** Starts tracking an entry; if the Member already is (say, a double submit), opens that Application. */
export async function startApplication(entry: CatalogEntry): Promise<void> {
  const member = await requireMember();
  let id;
  try {
    id = await core.startApplication(member.id, entry);
  } catch (error) {
    const existing = error instanceof InvalidInputError && (await core.applicationTo(member.id, entry));
    if (!existing) {
      throw error;
    }
    id = existing.id;
  }
  revalidatePath("/", "layout");
  redirect(`/applications/${id}`);
}

export async function setStage(id: number, stage: string): Promise<void> {
  const member = await requireMember();
  await core.setStage(member.id, id, stage);
  revalidatePath("/", "layout");
}

/**
 * Links a Scholarship Application to the Programme Application it would fund, or unlinks it
 * when given null. A rule broken (say, the Programme Application was deleted in another tab)
 * comes back as a message to show.
 */
export async function linkApplication(
  id: number,
  programmeApplicationId: number | null,
): Promise<string | undefined> {
  const member = await requireMember();
  let message;
  try {
    if (programmeApplicationId === null) {
      await core.unlinkApplication(member.id, id);
    } else {
      await core.linkApplication(member.id, id, programmeApplicationId);
    }
  } catch (error) {
    if (!(error instanceof InvalidInputError || error instanceof NotFoundError)) {
      throw error;
    }
    message = error.message;
  }
  revalidatePath("/", "layout");
  return message;
}

export async function editApplicationNotes(
  id: number,
  _state: NotesState,
  formData: FormData,
): Promise<NotesState> {
  const member = await requireMember();
  const notes = formData.get("notes");
  try {
    await core.editApplicationNotes(member.id, id, typeof notes === "string" ? notes : "");
  } catch (error) {
    if (error instanceof NotFoundError) {
      return { error: error.message };
    }
    throw error;
  }
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function deleteApplication(id: number): Promise<void> {
  const member = await requireMember();
  await core.deleteApplication(member.id, id);
  revalidatePath("/", "layout");
  redirect("/");
}

/**
 * Ticks a Requirement off an Application's Checklist, or unticks it. If it has just been
 * removed from the Catalog, the refreshed page shows it gone, so there's nothing to report.
 */
export async function tickRequirement(
  applicationId: number,
  requirementId: number,
  ticked: boolean,
): Promise<void> {
  const member = await requireMember();
  await ignoringNotFound(() =>
    core.tickRequirement(member.id, applicationId, requirementId, ticked),
  );
  revalidatePath("/", "layout");
}

export async function tickPersonalItem(id: number, ticked: boolean): Promise<void> {
  const member = await requireMember();
  await ignoringNotFound(() => core.tickPersonalItem(member.id, id, ticked));
  revalidatePath("/", "layout");
}

export async function addPersonalItem(
  applicationId: number,
  _state: PersonalItemState,
  formData: FormData,
): Promise<PersonalItemState> {
  const member = await requireMember();
  const label = labelOf(formData);
  return mutatePersonalItem(label, () => core.addPersonalItem(member.id, applicationId, label));
}

export async function editPersonalItem(
  id: number,
  _state: PersonalItemState,
  formData: FormData,
): Promise<PersonalItemState> {
  const member = await requireMember();
  const label = labelOf(formData);
  return mutatePersonalItem(label, () => core.editPersonalItem(member.id, id, label));
}

export async function deletePersonalItem(id: number): Promise<void> {
  const member = await requireMember();
  await core.deletePersonalItem(member.id, id);
  revalidatePath("/", "layout");
}

function labelOf(formData: FormData) {
  const label = formData.get("label");
  return typeof label === "string" ? label : "";
}

async function mutatePersonalItem(
  label: string,
  operation: () => Promise<unknown>,
): Promise<PersonalItemState> {
  try {
    await operation();
  } catch (error) {
    if (error instanceof InvalidInputError || error instanceof NotFoundError) {
      return { error: error.message, label };
    }
    throw error;
  }
  revalidatePath("/", "layout");
  return {};
}

async function ignoringNotFound(operation: () => Promise<void>) {
  try {
    await operation();
  } catch (error) {
    if (!(error instanceof NotFoundError)) {
      throw error;
    }
  }
}
