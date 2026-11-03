CREATE TYPE "public"."stage" AS ENUM('Interested', 'Preparing', 'Submitted', 'Interview', 'Accepted', 'Rejected', 'Withdrawn');--> statement-breakpoint
CREATE TABLE "application" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "application_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"member_id" text NOT NULL,
	"programme_id" integer,
	"scholarship_id" integer,
	"stage" "stage" DEFAULT 'Interested' NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "application_one_per_programme" UNIQUE("member_id","programme_id"),
	CONSTRAINT "application_one_per_scholarship" UNIQUE("member_id","scholarship_id"),
	CONSTRAINT "application_one_entry" CHECK (num_nonnulls("application"."programme_id", "application"."scholarship_id") = 1)
);
--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_member_id_member_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."member"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_programme_id_programme_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programme"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "application" ADD CONSTRAINT "application_scholarship_id_scholarship_id_fk" FOREIGN KEY ("scholarship_id") REFERENCES "public"."scholarship"("id") ON DELETE no action ON UPDATE no action;