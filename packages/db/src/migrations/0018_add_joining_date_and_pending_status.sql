ALTER TYPE "public"."student_status" ADD VALUE 'pending' BEFORE 'active';--> statement-breakpoint
ALTER TABLE "enrollments" ADD COLUMN "joining_date" date;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "joining_date_after_admission" CHECK (joining_date IS NULL OR joining_date >= admission_date::date);