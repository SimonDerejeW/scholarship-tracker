CREATE TABLE "scholarship" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "scholarship_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"provider" text NOT NULL,
	"link" text,
	"coverage" text,
	"notes" text,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "deadline" ALTER COLUMN "programme_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "requirement" ALTER COLUMN "programme_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "deadline" ADD COLUMN "scholarship_id" integer;--> statement-breakpoint
ALTER TABLE "requirement" ADD COLUMN "scholarship_id" integer;--> statement-breakpoint
ALTER TABLE "scholarship" ADD CONSTRAINT "scholarship_added_by_member_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline" ADD CONSTRAINT "deadline_scholarship_id_scholarship_id_fk" FOREIGN KEY ("scholarship_id") REFERENCES "public"."scholarship"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement" ADD CONSTRAINT "requirement_scholarship_id_scholarship_id_fk" FOREIGN KEY ("scholarship_id") REFERENCES "public"."scholarship"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "deadline" ADD CONSTRAINT "deadline_one_entry" CHECK (num_nonnulls("deadline"."programme_id", "deadline"."scholarship_id") = 1);--> statement-breakpoint
ALTER TABLE "requirement" ADD CONSTRAINT "requirement_one_entry" CHECK (num_nonnulls("requirement"."programme_id", "requirement"."scholarship_id") = 1);