-- 1. Atomic credit consumption to prevent race condition
CREATE OR REPLACE FUNCTION public.consume_credits(_user_id uuid, _amount integer, _action_type text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan text;
  v_limit integer;
  v_used integer;
BEGIN
  SELECT plan INTO v_plan FROM public.profiles WHERE id = _user_id FOR UPDATE;
  IF v_plan IS NULL THEN
    RETURN json_build_object('allowed', false, 'error', 'profile_not_found');
  END IF;
  v_limit := CASE v_plan WHEN 'enterprise' THEN 200 WHEN 'scale' THEN 50 ELSE 10 END;
  SELECT COALESCE(SUM(credits_used),0)::int INTO v_used
    FROM public.ai_credit_usage
    WHERE user_id = _user_id AND created_at >= date_trunc('month', now());
  IF v_used + _amount > v_limit THEN
    RETURN json_build_object('allowed', false, 'plan', v_plan, 'limit', v_limit, 'used', v_used, 'remaining', GREATEST(v_limit - v_used, 0));
  END IF;
  INSERT INTO public.ai_credit_usage (user_id, action_type, credits_used)
    VALUES (_user_id, _action_type, _amount);
  RETURN json_build_object('allowed', true, 'plan', v_plan, 'limit', v_limit, 'used', v_used + _amount, 'remaining', v_limit - v_used - _amount);
END;
$$;
REVOKE EXECUTE ON FUNCTION public.consume_credits(uuid, integer, text) FROM PUBLIC, anon, authenticated;

-- 2. Lock down SECURITY DEFINER function execution to authenticated only
REVOKE EXECUTE ON FUNCTION public.get_remaining_credits(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_remaining_credits(uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.update_own_profile(text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.update_own_profile(text, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, app_role) TO authenticated;

-- 3. Restrictive RLS to block any direct write on ai_credit_usage by users
CREATE POLICY "Block direct credit inserts"
  ON public.ai_credit_usage AS RESTRICTIVE FOR INSERT
  TO anon, authenticated
  WITH CHECK (false);
CREATE POLICY "Block direct credit updates"
  ON public.ai_credit_usage AS RESTRICTIVE FOR UPDATE
  TO anon, authenticated
  USING (false) WITH CHECK (false);
CREATE POLICY "Block direct credit deletes"
  ON public.ai_credit_usage AS RESTRICTIVE FOR DELETE
  TO anon, authenticated
  USING (false);

-- 4. Restrictive RLS on user_roles: only admins may insert/update/delete via API
CREATE POLICY "Only admins may insert roles"
  ON public.user_roles AS RESTRICTIVE FOR INSERT
  TO anon, authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins may update roles"
  ON public.user_roles AS RESTRICTIVE FOR UPDATE
  TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Only admins may delete roles"
  ON public.user_roles AS RESTRICTIVE FOR DELETE
  TO anon, authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 5. Trigger to prevent non-admin users from changing their own plan / is_active
CREATE OR REPLACE FUNCTION public.prevent_user_plan_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    NEW.plan := OLD.plan;
    NEW.is_active := OLD.is_active;
  END IF;
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS profiles_protect_plan ON public.profiles;
CREATE TRIGGER profiles_protect_plan
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.prevent_user_plan_change();

-- 6. Contact form: rate-limit table + tighten RLS to require server-side insert
CREATE TABLE IF NOT EXISTS public.contact_rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS contact_rate_limits_ip_time_idx
  ON public.contact_rate_limits (ip_hash, created_at DESC);
ALTER TABLE public.contact_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "No direct access to rate limits"
  ON public.contact_rate_limits AS RESTRICTIVE FOR ALL
  TO anon, authenticated USING (false) WITH CHECK (false);

DROP POLICY IF EXISTS "Anyone can insert contact messages" ON public.contact_messages;
-- No INSERT policy for anon/authenticated => only service role (edge function) can insert