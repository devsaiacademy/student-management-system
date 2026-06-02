CREATE TYPE "public"."user_role" AS ENUM('super_admin', 'admin', 'staff', 'parent');--> statement-breakpoint
-- Migrate user_profiles.role from varchar to user_role enum. Legacy 'student'
-- value maps to 'parent'; 'admin' is unchanged. No other values exist today.
ALTER TABLE "user_profiles" ALTER COLUMN "role" SET DATA TYPE "public"."user_role"
  USING (CASE "role" WHEN 'student' THEN 'parent' ELSE "role" END)::"public"."user_role";--> statement-breakpoint
-- Add email + name as nullable first so existing rows survive ADD COLUMN.
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
-- Refresh current_user_role(): role is now an enum, so cast to text
-- explicitly so the function's return type stays text. All RLS policies
-- compare against text literals; this preserves that contract.
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role::text FROM public.user_profiles WHERE id = auth.uid();
$$;--> statement-breakpoint
-- Replace handle_new_user with the final shape. The old @otomatiks.in
-- email-shape branch is gone; the trigger now resolves auth.users INSERTs
-- in this order:
--   1. If a profile already exists for new.id, no-op (super_admin /
--      admin pre-created via /admin/teachers and the user is logging in
--      for the second+ time).
--   2. If a profile exists with the same email but a different uuid
--      (stub created by users.create — auth.users wasn't touched), claim
--      it: UPDATE its id to new.id.
--   3. Else if the email matches a students row, auto-provision a parent
--      profile and link students.auth_user_id.
--   4. Otherwise: no-op; the middleware bounces profile-less sessions.
-- The trigger from 0000 (on_auth_user_created) continues to reference
-- public.handle_new_user by name, so no re-attach is needed.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  stub_profile_id uuid;
  student_match RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = new.id) THEN
    RETURN new;
  END IF;

  SELECT id INTO stub_profile_id
  FROM public.user_profiles
  WHERE LOWER(email) = LOWER(new.email)
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.user_profiles
       SET id = new.id
     WHERE id = stub_profile_id;
    RETURN new;
  END IF;

  SELECT id, name INTO student_match
  FROM public.students
  WHERE LOWER(email) = LOWER(new.email)
  LIMIT 1;

  IF FOUND THEN
    INSERT INTO public.user_profiles (id, email, name, role)
    VALUES (
      new.id,
      LOWER(new.email),
      COALESCE(NULLIF(new.raw_user_meta_data->>'name', ''), student_match.name),
      'parent'
    )
    ON CONFLICT (id) DO NOTHING;

    UPDATE public.students
       SET auth_user_id = new.id
     WHERE LOWER(email) = LOWER(new.email)
       AND auth_user_id IS NULL;
  END IF;

  RETURN new;
END;
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
