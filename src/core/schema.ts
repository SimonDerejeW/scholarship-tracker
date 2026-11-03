import { boolean, date, integer, pgTable, text, timestamp } from "drizzle-orm/pg-core";

// Better Auth's tables. Its "user" model is mapped to `member` (see GLOSSARY.md).

export const member = pgTable("member", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => member.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// The Catalog.

export const programme = pgTable("programme", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  university: text("university").notNull(),
  country: text("country"),
  link: text("link"),
  fundingIncluded: boolean("funding_included").notNull().default(false),
  notes: text("notes"),
  addedBy: text("added_by")
    .notNull()
    .references(() => member.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Date-only: an exact cutoff time, if any, lives in the label. */
export const deadline = pgTable("deadline", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  programmeId: integer("programme_id")
    .notNull()
    .references(() => programme.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  date: date("date", { mode: "string" }).notNull(),
});

export const requirement = pgTable("requirement", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  programmeId: integer("programme_id")
    .notNull()
    .references(() => programme.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  note: text("note"),
});
