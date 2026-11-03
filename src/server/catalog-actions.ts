"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { InvalidInputError, NotFoundError, type CatalogEntry } from "@/core";
import { core } from "./core";
import { requireMember } from "./session";

/** What a Catalog form shows after submitting: a rule broken, with what was typed so it isn't lost. */
export type FormState = { error?: string; values?: Record<string, string> };

export async function addProgramme(_state: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  let id = 0;
  const state = await mutate(formData, async () => {
    id = await core.addProgramme(member.id, programmeInput(formData));
  });
  if (state.error) {
    return state;
  }
  redirect(`/catalog/programmes/${id}`);
}

export async function editProgramme(
  id: number,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const state = await mutate(formData, () =>
    core.editProgramme(member.id, id, programmeInput(formData)),
  );
  if (state.error) {
    return state;
  }
  redirect(`/catalog/programmes/${id}`);
}

export async function addScholarship(_state: FormState, formData: FormData): Promise<FormState> {
  const member = await requireMember();
  let id = 0;
  const state = await mutate(formData, async () => {
    id = await core.addScholarship(member.id, scholarshipInput(formData));
  });
  if (state.error) {
    return state;
  }
  redirect(`/catalog/scholarships/${id}`);
}

export async function editScholarship(
  id: number,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  const state = await mutate(formData, () =>
    core.editScholarship(member.id, id, scholarshipInput(formData)),
  );
  if (state.error) {
    return state;
  }
  redirect(`/catalog/scholarships/${id}`);
}

export async function addDeadline(
  entry: CatalogEntry,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  return mutate(formData, () => core.addDeadline(member.id, entry, deadlineInput(formData)));
}

export async function editDeadline(
  id: number,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  return mutate(formData, () => core.editDeadline(member.id, id, deadlineInput(formData)));
}

export async function removeDeadline(id: number): Promise<void> {
  const member = await requireMember();
  await core.removeDeadline(member.id, id);
  revalidatePath("/catalog", "layout");
}

export async function addRequirement(
  entry: CatalogEntry,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  return mutate(formData, () =>
    core.addRequirement(member.id, entry, requirementInput(formData)),
  );
}

export async function editRequirement(
  id: number,
  _state: FormState,
  formData: FormData,
): Promise<FormState> {
  const member = await requireMember();
  return mutate(formData, () =>
    core.editRequirement(member.id, id, requirementInput(formData)),
  );
}

export async function removeRequirement(id: number): Promise<void> {
  const member = await requireMember();
  await core.removeRequirement(member.id, id);
  revalidatePath("/catalog", "layout");
}

async function mutate(formData: FormData, operation: () => Promise<unknown>): Promise<FormState> {
  try {
    await operation();
  } catch (error) {
    if (error instanceof InvalidInputError || error instanceof NotFoundError) {
      return { error: error.message, values: textFields(formData) };
    }
    throw error;
  }
  revalidatePath("/catalog", "layout");
  return {};
}

function programmeInput(formData: FormData) {
  return {
    name: text(formData, "name"),
    university: text(formData, "university"),
    country: text(formData, "country"),
    link: text(formData, "link"),
    fundingIncluded: formData.get("fundingIncluded") === "on",
    notes: text(formData, "notes"),
  };
}

function scholarshipInput(formData: FormData) {
  return {
    name: text(formData, "name"),
    provider: text(formData, "provider"),
    link: text(formData, "link"),
    coverage: text(formData, "coverage"),
    notes: text(formData, "notes"),
  };
}

function deadlineInput(formData: FormData) {
  return { label: text(formData, "label"), date: text(formData, "date") };
}

function requirementInput(formData: FormData) {
  return { label: text(formData, "label"), note: text(formData, "note") };
}

function text(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : "";
}

function textFields(formData: FormData) {
  const values: Record<string, string> = {};
  formData.forEach((value, name) => {
    if (typeof value === "string" && !name.startsWith("$ACTION")) {
      values[name] = value;
    }
  });
  return values;
}
