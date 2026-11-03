import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  date,
  integer,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

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

export const scholarship = pgTable("scholarship", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  name: text("name").notNull(),
  provider: text("provider").notNull(),
  link: text("link"),
  /** What it covers, e.g. tuition and a monthly stipend. */
  coverage: text("coverage"),
  notes: text("notes"),
  addedBy: text("added_by")
    .notNull()
    .references(() => member.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Deadlines and Requirements each belong to exactly one Programme or Scholarship.

/** Date-only: an exact cutoff time, if any, lives in the label. */
export const deadline = pgTable(
  "deadline",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    programmeId: integer("programme_id").references(() => programme.id, { onDelete: "cascade" }),
    scholarshipId: integer("scholarship_id").references(() => scholarship.id, {
      onDelete: "cascade",
    }),
    label: text("label").notNull(),
    date: date("date", { mode: "string" }).notNull(),
  },
  (t) => [
    check("deadline_one_entry", sql`num_nonnulls(${t.programmeId}, ${t.scholarshipId}) = 1`),
  ],
);

export const requirement = pgTable(
  "requirement",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    programmeId: integer("programme_id").references(() => programme.id, { onDelete: "cascade" }),
    scholarshipId: integer("scholarship_id").references(() => scholarship.id, {
      onDelete: "cascade",
    }),
    label: text("label").notNull(),
    note: text("note"),
  },
  (t) => [
    check("requirement_one_entry", sql`num_nonnulls(${t.programmeId}, ${t.scholarshipId}) = 1`),
  ],
);

// Tracking: each Member's private Applications (ADR 0001).

/** Where an Application stands, in the order a Member usually moves through them. */
export const STAGES = [
  "Interested",
  "Preparing",
  "Submitted",
  "Interview",
  "Accepted",
  "Rejected",
  "Withdrawn",
] as const;

export const stage = pgEnum("stage", STAGES);

/** One Member's Application to exactly one Programme or Scholarship; at most one per entry. */
export const application = pgTable(
  "application",
  {
    id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
    memberId: text("member_id")
      .notNull()
      .references(() => member.id, { onDelete: "cascade" }),
    programmeId: integer("programme_id").references(() => programme.id),
    scholarshipId: integer("scholarship_id").references(() => scholarship.id),
    stage: stage("stage").notNull().default("Interested"),
    notes: text("notes"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => [
    check("application_one_entry", sql`num_nonnulls(${t.programmeId}, ${t.scholarshipId}) = 1`),
    unique("application_one_per_programme").on(t.memberId, t.programmeId),
    unique("application_one_per_scholarship").on(t.memberId, t.scholarshipId),
  ],
);

// Checklists follow the Catalog live (ADR 0003): an Application's Checklist is its
// entry's current Requirements, so only the Member's ticks on them are stored.
// Removing a Requirement removes its ticks.

/** A Member's tick on one Requirement of their Application's entry. */
export const requirementTick = pgTable(
  "requirement_tick",
  {
    applicationId: integer("application_id")
      .notNull()
      .references(() => application.id, { onDelete: "cascade" }),
    requirementId: integer("requirement_id")
      .notNull()
      .references(() => requirement.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.applicationId, t.requirementId] })],
);

/** A Checklist item a Member adds to their own Application, not shared to the Catalog. */
export const personalItem = pgTable("personal_item", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  applicationId: integer("application_id")
    .notNull()
    .references(() => application.id, { onDelete: "cascade" }),
  label: text("label").notNull(),
  ticked: boolean("ticked").notNull().default(false),
});
