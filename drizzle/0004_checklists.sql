CREATE TABLE "personal_item" (
	"id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY (sequence name "personal_item_id_seq" INCREMENT BY 1 MINVALUE 1 MAXVALUE 2147483647 START WITH 1 CACHE 1),
	"application_id" integer NOT NULL,
	"label" text NOT NULL,
	"ticked" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "requirement_tick" (
	"application_id" integer NOT NULL,
	"requirement_id" integer NOT NULL,
	CONSTRAINT "requirement_tick_application_id_requirement_id_pk" PRIMARY KEY("application_id","requirement_id")
);
--> statement-breakpoint
ALTER TABLE "personal_item" ADD CONSTRAINT "personal_item_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_tick" ADD CONSTRAINT "requirement_tick_application_id_application_id_fk" FOREIGN KEY ("application_id") REFERENCES "public"."application"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "requirement_tick" ADD CONSTRAINT "requirement_tick_requirement_id_requirement_id_fk" FOREIGN KEY ("requirement_id") REFERENCES "public"."requirement"("id") ON DELETE cascade ON UPDATE no action;