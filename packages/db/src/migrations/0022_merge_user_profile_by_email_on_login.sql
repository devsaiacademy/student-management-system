-- Extend handle_new_user with an "email merge" branch so admin-created
-- stub profiles get reattached to the real auth.uid() on first login.
--
-- Resolution order on auth.users INSERT:
--   1. user_profiles already has a row for the new auth uid → no-op.
--   2. user_profiles has a row with matching email but a placeholder
--      uuid (admin pre-created via /admin/users) → UPDATE its id to
--      auth.users.id. This is what makes "Add user" work without ever
--      calling the Supabase Auth admin API.
--   3. Email matches a students row → auto-create a parent profile
--      and link students.auth_user_id (legacy parent flow).
--   4. Otherwise: do nothing. Middleware bounces profile-less users.
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
$$;
