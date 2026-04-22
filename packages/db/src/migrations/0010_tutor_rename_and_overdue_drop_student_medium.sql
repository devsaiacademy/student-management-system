ALTER TYPE "public"."payment_status" ADD VALUE 'overdue';--> statement-breakpoint
ALTER TABLE "enrollments" RENAME COLUMN "tutor_name" TO "enrolled_by";--> statement-breakpoint
ALTER TABLE "students" DROP COLUMN "enrolled_medium";