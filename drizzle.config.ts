import "dotenv/config";
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  dialect: "postgresql",
  schema: "./src/core/schema.ts",
  out: "./drizzle",
  // Migrations need a direct connection; on Neon, DATABASE_URL is the pooled one.
  dbCredentials: { url: (process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL)! },
});
