
-- Drop the overly permissive user UPDATE policy
DROP POLICY "Users can update their own profile" ON public.profiles;

-- Create a SECURITY DEFINER function that only allows updating safe columns
CREATE OR REPLACE FUNCTION public.update_own_profile(_full_name text DEFAULT NULL, _company_name text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET
    full_name = COALESCE(_full_name, full_name),
    company_name = COALESCE(_company_name, company_name),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;
