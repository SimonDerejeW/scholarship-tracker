import "server-only";
import { drizzle } from "drizzle-orm/node-postgres";
import { createCore } from "@/core";
import * as schema from "@/core/schema";
import { requireEnv } from "./env";

export const db = drizzle(requireEnv("DATABASE_URL"), { schema });

export const core = createCore({ db, adminEmail: requireEnv("ADMIN_EMAIL") });
