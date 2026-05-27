ALTER TYPE "public"."payment_status" ADD VALUE 'partially_paid';--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "amount_paid" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "partial_payment_enabled" boolean DEFAULT false NOT NULL;