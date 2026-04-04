CREATE TYPE "public"."payment_method" AS ENUM('cash', 'razorpay', 'others');--> statement-breakpoint
CREATE TYPE "public"."payment_plan" AS ENUM('single', 'flexible');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('paid', 'unpaid');--> statement-breakpoint
CREATE TYPE "public"."student_progress_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."student_status" AS ENUM('active', 'in_active', 'discontinue');--> statement-breakpoint
CREATE TABLE "enrollments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"course" varchar(100) NOT NULL,
	"level" varchar(50) NOT NULL,
	"duration" varchar(50) NOT NULL,
	"tutor_name" varchar(100) NOT NULL,
	"total_fees" integer NOT NULL,
	"payment_plan" "payment_plan" NOT NULL,
	"emi_months" integer,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "enrollments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "payments" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"enrollment_id" integer NOT NULL,
	"razorpay_order_id" integer,
	"amount" integer NOT NULL,
	"description" varchar(255),
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"payment_method" "payment_method" NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"emi_number" integer,
	"due_date" date NOT NULL,
	"paid_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "payments" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "razorpay_orders" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"razorpay_order_id" varchar(255) NOT NULL,
	"amount" integer NOT NULL,
	"currency" varchar(3) DEFAULT 'INR' NOT NULL,
	"receipt" varchar(255),
	"status" varchar(50) DEFAULT 'created' NOT NULL,
	"razorpay_payment_id" varchar(255),
	"razorpay_signature" varchar(255),
	"notes" json,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "razorpay_orders_razorpay_order_id_unique" UNIQUE("razorpay_order_id")
);
--> statement-breakpoint
ALTER TABLE "razorpay_orders" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "student_progress" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"enrollment_id" integer NOT NULL,
	"course" varchar(100) NOT NULL,
	"level" varchar(50) NOT NULL,
	"duration" varchar(50) NOT NULL,
	"kit_provided" boolean DEFAULT false NOT NULL,
	"tutor_name" varchar(100) NOT NULL,
	"status" "student_progress_status" DEFAULT 'in_progress' NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "student_progress" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"auth_user_id" uuid,
	"name" varchar(100) NOT NULL,
	"roll_number" varchar(50) NOT NULL,
	"age" integer NOT NULL,
	"phone_number" varchar(15) NOT NULL,
	"email" varchar(100) NOT NULL,
	"school_name" varchar(255) NOT NULL,
	"standard" varchar(20) NOT NULL,
	"academic_year" varchar(20) NOT NULL,
	"enrolled_medium" varchar(50) NOT NULL,
	"mother_name" varchar(100),
	"mother_occupation" varchar(100),
	"father_name" varchar(100),
	"father_occupation" varchar(100),
	"student_status" "student_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_auth_user_id_unique" UNIQUE("auth_user_id"),
	CONSTRAINT "students_roll_number_unique" UNIQUE("roll_number"),
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "students" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE TABLE "user_profiles" (
	"id" uuid PRIMARY KEY NOT NULL,
	"role" varchar(20) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_profiles" ENABLE ROW LEVEL SECURITY;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
	SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;--> statement-breakpoint
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_razorpay_order_id_fk" FOREIGN KEY ("razorpay_order_id") REFERENCES "public"."razorpay_orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "razorpay_orders" ADD CONSTRAINT "razorpay_orders_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_student_id_fk" FOREIGN KEY ("student_id") REFERENCES "public"."students"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "student_progress" ADD CONSTRAINT "student_progress_enrollment_id_fk" FOREIGN KEY ("enrollment_id") REFERENCES "public"."enrollments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE POLICY "enrollments_select_policy_student" ON "enrollments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'student');--> statement-breakpoint
CREATE POLICY "enrollments_select_policy_admin" ON "enrollments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "enrollments_insert_policy" ON "enrollments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "enrollments_update_policy" ON "enrollments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "enrollments_delete_policy" ON "enrollments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "payments_select_policy_student" ON "payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'student');--> statement-breakpoint
CREATE POLICY "payments_select_policy_admin" ON "payments" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "payments_insert_policy" ON "payments" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "payments_update_policy" ON "payments" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "payments_delete_policy" ON "payments" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "razorpay_orders_select_policy_student" ON "razorpay_orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'student');--> statement-breakpoint
CREATE POLICY "razorpay_orders_select_policy_admin" ON "razorpay_orders" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "razorpay_orders_insert_policy" ON "razorpay_orders" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "razorpay_orders_update_policy" ON "razorpay_orders" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "razorpay_orders_delete_policy" ON "razorpay_orders" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "student_progress_select_policy_student" ON "student_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'student');--> statement-breakpoint
CREATE POLICY "student_progress_select_policy_admin" ON "student_progress" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "student_progress_insert_policy" ON "student_progress" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "student_progress_update_policy" ON "student_progress" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "student_progress_delete_policy" ON "student_progress" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "students_select_policy_student" ON "students" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = auth_user_id AND public.current_user_role() = 'student');--> statement-breakpoint
CREATE POLICY "students_select_policy_admin" ON "students" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "students_insert_policy" ON "students" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "students_update_policy" ON "students" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "students_delete_policy" ON "students" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.current_user_role() = 'admin');--> statement-breakpoint
CREATE POLICY "user_profiles_select_own" ON "user_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (auth.uid() = id);--> statement-breakpoint
CREATE POLICY "user_profiles_select_admin" ON "user_profiles" AS PERMISSIVE FOR SELECT TO "authenticated" USING (public.current_user_role() = 'admin');
CREATE OR REPLACE FUNCTION public.validate_payment_student_match()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT student_id FROM public.enrollments WHERE id = NEW.enrollment_id) != NEW.student_id THEN
    RAISE EXCEPTION 'Enrollment % does not belong to student %', NEW.enrollment_id, NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER check_payment_student_match
  BEFORE INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_payment_student_match();--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.validate_progress_student_match()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF (SELECT student_id FROM public.enrollments WHERE id = NEW.enrollment_id) != NEW.student_id THEN
    RAISE EXCEPTION 'Enrollment % does not belong to student %', NEW.enrollment_id, NEW.student_id;
  END IF;
  RETURN NEW;
END;
$$;--> statement-breakpoint
CREATE TRIGGER check_progress_student_match
  BEFORE INSERT OR UPDATE ON public.student_progress
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_progress_student_match();--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.current_user_role() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_profiles WHERE id = auth.uid();
$$;--> statement-breakpoint
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  IF new.email ILIKE '%@otomatiks.in' THEN
    user_role := 'admin';
  ELSIF EXISTS (SELECT 1 FROM public.students WHERE LOWER(email) = LOWER(new.email)) THEN
    user_role := 'student';
  ELSE
    RAISE EXCEPTION 'Login denied: email % is not whitelisted or registered as a student', new.email;
  END IF;

  INSERT INTO public.user_profiles (id, role)
  VALUES (new.id, user_role);

  IF user_role = 'student' THEN
    UPDATE public.students SET auth_user_id = new.id WHERE LOWER(email) = LOWER(new.email);
  END IF;

  RETURN new;
END;
$$;--> statement-breakpoint
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();