-- Drop the auth-user-created trigger + function. Profile creation is now
-- explicit in the tRPC users.create / students.create mutations; no more
-- email-shape inference.
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;--> statement-breakpoint
DROP FUNCTION IF EXISTS public.handle_new_user();--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'staff', 'parent');--> statement-breakpoint
-- Migrate user_profiles.role from varchar to user_role enum. Legacy 'student'
-- value maps to 'parent'; 'admin' is unchanged. Rows with any other value
-- would fail the cast — none exist today (column was always 'admin' or
-- 'student'), so no further branches needed.
ALTER TABLE "user_profiles" ALTER COLUMN "role" SET DATA TYPE "public"."user_role"
  USING (CASE "role" WHEN 'student' THEN 'parent' ELSE "role" END)::"public"."user_role";--> statement-breakpoint
-- Add email + name as nullable first so existing rows survive the ADD COLUMN.
ALTER TABLE "user_profiles" ADD COLUMN "email" varchar(255);--> statement-breakpoint
ALTER TABLE "user_profiles" ADD COLUMN "name" varchar(255);--> statement-breakpoint
-- Backfill email + name from auth.users. Name falls back to the email
-- local-part when no metadata name is present.
UPDATE "user_profiles" up
SET "email" = au.email,
    "name"  = COALESCE(
                NULLIF(au.raw_user_meta_data->>'name', ''),
                split_part(au.email, '@', 1)
              )
FROM auth.users au
WHERE au.id = up.id;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "email" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ALTER COLUMN "name" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user_profiles" ADD CONSTRAINT "user_profiles_email_unique" UNIQUE("email");--> statement-breakpoint
-- Refresh current_user_role(): role is now an enum, so cast to text explicitly
-- to keep the function's return type stable. All RLS policies compare against
-- text literals; this preserves that contract.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.user_profiles WHERE id = auth.uid();
$$;--> statement-breakpoint
CREATE POLICY "user_profiles_insert_admin" ON "user_profiles" AS PERMISSIVE FOR INSERT TO "authenticated" WITH CHECK (public.current_user_role() IN ('admin', 'super_admin'));--> statement-breakpoint
CREATE POLICY "user_profiles_update_admin" ON "user_profiles" AS PERMISSIVE FOR UPDATE TO "authenticated" USING (public.current_user_role() IN ('admin', 'super_admin'));--> statement-breakpoint
CREATE POLICY "user_profiles_delete_admin" ON "user_profiles" AS PERMISSIVE FOR DELETE TO "authenticated" USING (public.current_user_role() IN ('admin', 'super_admin'));--> statement-breakpoint
ALTER POLICY "enrollments_select_policy_student" ON "enrollments" TO authenticated USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'parent');--> statement-breakpoint
ALTER POLICY "enrollments_select_policy_admin" ON "enrollments" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "enrollments_insert_policy" ON "enrollments" TO authenticated WITH CHECK (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "enrollments_update_policy" ON "enrollments" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "enrollments_delete_policy" ON "enrollments" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "payments_select_policy_student" ON "payments" TO authenticated USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'parent');--> statement-breakpoint
ALTER POLICY "payments_select_policy_admin" ON "payments" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "payments_insert_policy" ON "payments" TO authenticated WITH CHECK (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "payments_update_policy" ON "payments" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "payments_delete_policy" ON "payments" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "razorpay_orders_select_policy_student" ON "razorpay_orders" TO authenticated USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'parent');--> statement-breakpoint
ALTER POLICY "razorpay_orders_select_policy_admin" ON "razorpay_orders" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "razorpay_orders_insert_policy" ON "razorpay_orders" TO authenticated WITH CHECK (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "razorpay_orders_update_policy" ON "razorpay_orders" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "razorpay_orders_delete_policy" ON "razorpay_orders" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "student_progress_select_policy_student" ON "student_progress" TO authenticated USING (student_id IN (SELECT id FROM students WHERE auth_user_id = auth.uid()) AND public.current_user_role() = 'parent');--> statement-breakpoint
ALTER POLICY "student_progress_select_policy_admin" ON "student_progress" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "student_progress_insert_policy" ON "student_progress" TO authenticated WITH CHECK (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "student_progress_update_policy" ON "student_progress" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "student_progress_delete_policy" ON "student_progress" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "students_select_policy_student" ON "students" TO authenticated USING (auth.uid() = auth_user_id AND public.current_user_role() = 'parent');--> statement-breakpoint
ALTER POLICY "students_select_policy_admin" ON "students" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "students_insert_policy" ON "students" TO authenticated WITH CHECK (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "students_update_policy" ON "students" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "students_delete_policy" ON "students" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin', 'staff'));--> statement-breakpoint
ALTER POLICY "user_profiles_select_admin" ON "user_profiles" TO authenticated USING (public.current_user_role() IN ('admin', 'super_admin'));
