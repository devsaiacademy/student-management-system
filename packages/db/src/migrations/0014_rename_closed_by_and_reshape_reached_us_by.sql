ALTER TABLE "enrollments" RENAME COLUMN "enrolled_by" TO "closed_by";--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "reached_us_by" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "reached_us_by" SET DEFAULT 'Board / Walkin'::text;--> statement-breakpoint
DROP TYPE "public"."reached_us_by";--> statement-breakpoint
CREATE TYPE "public"."reached_us_by" AS ENUM('Board / Walkin', 'G Adds', 'Meta Adds', 'Referral', 'Call', 'DM', 'Other Branches');--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "reached_us_by" SET DEFAULT 'Board / Walkin'::"public"."reached_us_by";--> statement-breakpoint
ALTER TABLE "students" ALTER COLUMN "reached_us_by" SET DATA TYPE "public"."reached_us_by" USING "reached_us_by"::"public"."reached_us_by";