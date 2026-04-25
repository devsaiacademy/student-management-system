ALTER TYPE "public"."student_source" RENAME TO "reached_us_by";--> statement-breakpoint
ALTER TABLE "students" RENAME COLUMN "student_source" TO "reached_us_by";