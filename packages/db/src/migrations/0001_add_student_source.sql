CREATE TYPE "public"."student_source" AS ENUM('Banner', 'Referral');--> statement-breakpoint
ALTER TABLE "students" ADD COLUMN "student_source" "student_source" DEFAULT 'Banner' NOT NULL;