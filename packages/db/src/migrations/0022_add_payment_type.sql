CREATE TYPE "public"."payment_type" AS ENUM('tuition_fee', 'kit_fee');--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "payment_type" "payment_type" DEFAULT 'tuition_fee' NOT NULL;--> statement-breakpoint
UPDATE "payments" SET "payment_type" = 'kit_fee' WHERE "description" = 'Kit';