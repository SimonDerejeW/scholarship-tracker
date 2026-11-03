import "server-only";
import { notFound } from "next/navigation";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";

/** The Programme a /catalog/programmes/[id] route is about, or a 404. */
export async function loadProgramme(params: Promise<{ id: string }>) {
  const member = await requireMember();
  const { id } = await params;
  const programme = /^\d+$/.test(id) ? await core.getProgramme(member.id, Number(id)) : null;
  if (!programme) {
    notFound();
  }
  return programme;
}
