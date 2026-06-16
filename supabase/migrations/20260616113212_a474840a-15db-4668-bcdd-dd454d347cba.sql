
-- 1) Force plan='free' on signup regardless of client metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, plan)
  VALUES (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    'free'
  );
  RETURN new;
END;
$function$;

-- 2) Restrictive deny policies on ai_ranking_results for UPDATE/DELETE
DROP POLICY IF EXISTS "Deny updates to ranking results" ON public.ai_ranking_results;
DROP POLICY IF EXISTS "Deny deletes of ranking results" ON public.ai_ranking_results;

CREATE POLICY "Deny updates to ranking results"
ON public.ai_ranking_results
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny deletes of ranking results"
ON public.ai_ranking_results
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);
