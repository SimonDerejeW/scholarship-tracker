import "server-only";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export type Member = { id: string; name: string; email: string };

/** The signed-in Member, or a redirect to sign-in. Call it close to the data. */
export async function requireMember(): Promise<Member> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/sign-in");
  }
  const { id, name, email } = session.user;
  return { id, name, email };
}
