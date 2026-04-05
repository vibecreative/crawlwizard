CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    COALESCE(new.raw_user_meta_data ->> 'plan', 'free')
  );
  RETURN new;
END;
$$;