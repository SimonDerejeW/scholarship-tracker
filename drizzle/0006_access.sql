CREATE TABLE "allowlist_entry" (
	"email" text PRIMARY KEY NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "member" ADD COLUMN "removed_at" timestamp;