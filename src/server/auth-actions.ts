"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "./auth";

export async function signInWithGoogle() {
  const { url } = await auth.api.signInSocial({
    headers: await headers(),
    body: { provider: "google", callbackURL: "/", errorCallbackURL: "/sign-in" },
  });
  if (!url) {
    throw new Error("Google sign-in did not return a redirect URL.");
  }
  redirect(url);
}

export async function signOut() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/sign-in");
}
