CREATE TYPE "public"."payment_method" AS ENUM('razorpay', 'cash', 'bank_transfer');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('pending', 'paid', 'failed');--> statement-breakpoint
CREATE TYPE "public"."payment_type" AS ENUM('single', 'flexible');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('active', 'in_active', 'discontinue');--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"roll_number" varchar(50) NOT NULL,
	"age" integer NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	"email" varchar(100) NOT NULL,
	"school_name" varchar(255) NOT NULL,
	"standard" varchar(20) NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"mother_occupation" varchar(100),
	"father_occupation" varchar(100),
	"total_fees" integer NOT NULL,
	"payment_type" "payment_type" NOT NULL,
	"emi_months" integer,
	"level" varchar(50),
	"student_status" "student_status" DEFAULT 'active' NOT NULL,
	"kit_provided" boolean DEFAULT false,
	"tutor_name" varchar(100),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_roll_number_unique" UNIQUE("roll_number"),
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
