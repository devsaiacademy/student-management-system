ALTER TABLE "enrollments" ADD COLUMN "start_date" timestamp NOT NULL;--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "kit_provided" boolean DEFAULT false NOT NULL;