
-- 1. Remove client INSERT policy on ai_credit_usage (credits should only be inserted by service role from edge functions)
DROP POLICY "Users can insert own credit usage" ON public.ai_credit_usage;

-- 2. Add CHECK constraint to ensure credits_used is always positive
ALTER TABLE public.ai_credit_usage ADD CONSTRAINT credits_used_positive CHECK (credits_used > 0);

-- 3. Add DB-level constraints on contact_messages to prevent spam/malformed data
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_name_length CHECK (length(name) BETWEEN 2 AND 200);
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_email_format CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$');
ALTER TABLE public.contact_messages ADD CONSTRAINT contact_message_length CHECK (length(message) BETWEEN 10 AND 5000);
