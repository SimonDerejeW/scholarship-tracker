CREATE TABLE "deadline" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "deadline_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"programme_id" integer NOT NULL,
	"label" text NOT NULL,
	"date" date NOT NULL
);
--> statement-breakpoint
CREATE TABLE "programme" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "programme_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"name" text NOT NULL,
	"university" text NOT NULL,
	"country" text,
	"link" text,
	"funding_included" boolean DEFAULT false NOT NULL,
	"notes" text,
	"added_by" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "requirement_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"programme_id" integer NOT NULL,
	"label" text NOT NULL,
	"note" text
);
--> statement-breakpoint
ALTER TABLE "deadline" ADD CONSTRAINT "deadline_programme_id_programme_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programme"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "programme" ADD CONSTRAINT "programme_added_by_member_id_fk" FOREIGN KEY ("added_by") REFERENCES "public"."member"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement" ADD CONSTRAINT "requirement_programme_id_programme_id_fk" FOREIGN KEY ("programme_id") REFERENCES "public"."programme"("id") ON DELETE cascade ON UPDATE no action;