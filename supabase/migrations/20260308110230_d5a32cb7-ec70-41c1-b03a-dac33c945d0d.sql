
-- Credit usage tracking table
CREATE TABLE public.ai_credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL,
  credits_used INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index for fast monthly lookups
CREATE INDEX idx_ai_credit_usage_user_month ON public.ai_credit_usage (user_id, created_at);

-- Enable RLS
ALTER TABLE public.ai_credit_usage ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own credit usage"
ON public.ai_credit_usage FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can insert their own usage (via edge functions)
CREATE POLICY "Users can insert own credit usage"
ON public.ai_credit_usage FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Function to get remaining credits for a user this month
CREATE OR REPLACE FUNCTION public.get_remaining_credits(_user_id UUID)
RETURNS JSON
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT json_build_object(
    'plan', p.plan,
    'limit', CASE p.plan
      WHEN 'enterprise' THEN 200
      WHEN 'scale' THEN 50
      ELSE 10
    END,
    'used', COALESCE((
      SELECT SUM(credits_used)::INTEGER
      FROM public.ai_credit_usage u
      WHERE u.user_id = _user_id
        AND u.created_at >= date_trunc('month', now())
    ), 0),
    'remaining', CASE p.plan
      WHEN 'enterprise' THEN 200
      WHEN 'scale' THEN 50
      ELSE 10
    END - COALESCE((
      SELECT SUM(credits_used)::INTEGER
      FROM public.ai_credit_usage u
      WHERE u.user_id = _user_id
        AND u.created_at >= date_trunc('month', now())
    ), 0)
  )
  FROM public.profiles p
  WHERE p.id = _user_id
$$;
