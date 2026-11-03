import "server-only";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { APIError } from "better-auth/api";
import { nextCookies } from "better-auth/next-js";
import * as schema from "@/core/schema";
import { NOT_INVITED } from "./auth-errors";
import { core, db } from "./core";
import { requireEnv } from "./env";

async function rejectUninvited(email: string) {
  if (!(await core.canSignIn(email))) {
    throw new APIError("FORBIDDEN", {
      code: NOT_INVITED,
      message: "This email is not invited.",
    });
  }
}

export const auth = betterAuth({
  secret: requireEnv("BETTER_AUTH_SECRET"),
  baseURL: requireEnv("BETTER_AUTH_URL"),
  database: drizzleAdapter(db, { provider: "pg", schema }),
  user: { modelName: "member" },
  socialProviders: {
    google: {
      clientId: requireEnv("GOOGLE_CLIENT_ID"),
      clientSecret: requireEnv("GOOGLE_CLIENT_SECRET"),
      // Always offer the account picker, so a "not invited" visitor can switch.
      prompt: "select_account",
    },
  },
  databaseHooks: {
    // Checked when a Member record would be created, and again on every
    // sign-in, so nobody outside canSignIn ever gets a session.
    user: {
      create: {
        before: async (member) => {
          await rejectUninvited(member.email);
        },
      },
    },
    session: {
      create: {
        before: async (session, ctx) => {
          const member = await ctx?.context.internalAdapter.findUserById(
            session.userId,
          );
          await rejectUninvited(member?.email ?? "");
        },
      },
    },
  },
  plugins: [nextCookies()],
});
