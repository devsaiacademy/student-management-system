CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  IF new.email ILIKE '%@otomatiks.in' OR new.email = 'connectbalajidev@gmail.com' THEN
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
$$;