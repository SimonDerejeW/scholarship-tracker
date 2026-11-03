"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InvalidInputError, NotFoundError, type CatalogEntry } from "@/core";
import { core } from "./core";
import { requireMember } from "./session";

/** What the notes form shows after saving. */
export type NotesState = { error?: string; saved?: boolean };

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
