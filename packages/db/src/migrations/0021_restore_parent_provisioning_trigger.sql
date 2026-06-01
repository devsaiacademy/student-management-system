-- Restore the auth.users → user_profiles trigger, but in a simpler form
-- than the original. The pre-existing handle_new_user (dropped in 0020)
-- baked an @otomatiks.in email-shape check; we don't want that back.
--
-- New shape:
--   1. If user_profiles already has a row for the new auth uid (admin
--      pre-provisioned via users.create), do nothing.
--   2. Else if the new email matches a students row, auto-create a
--      parent profile and link students.auth_user_id.
--   3. Else: let the auth.users INSERT proceed without a profile. The
--      app middleware will bounce them on next request.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  student_match RECORD;
BEGIN
  IF EXISTS (SELECT 1 FROM public.user_profiles WHERE id = new.id) THEN
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
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;--> statement-breakpoint
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
