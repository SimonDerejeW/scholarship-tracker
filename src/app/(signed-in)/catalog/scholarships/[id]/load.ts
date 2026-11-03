import "server-only";
import { notFound } from "next/navigation";
import { core } from "@/server/core";
import { requireMember } from "@/server/session";

/** The Scholarship a /catalog/scholarships/[id] route is about, or a 404. */
export async function loadScholarship(params: Promise<{ id: string }>) {
  const member = await requireMember();
  const { id } = await params;
  const scholarship = /^\d+$/.test(id) ? await core.getScholarship(member.id, Number(id)) : null;
  if (!scholarship) {
    notFound();
  }
  return scholarship;
}
