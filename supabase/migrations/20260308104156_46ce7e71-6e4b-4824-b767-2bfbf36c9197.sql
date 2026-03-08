
-- Create table for AI ranking checks
CREATE TABLE public.ai_ranking_checks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  page_id UUID NOT NULL REFERENCES public.project_pages(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for individual AI ranking results per question per model
CREATE TABLE public.ai_ranking_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  check_id UUID NOT NULL REFERENCES public.ai_ranking_checks(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  model TEXT NOT NULL,
  ai_response TEXT,
  is_mentioned BOOLEAN DEFAULT false,
  mention_position INTEGER,
  sentiment TEXT DEFAULT 'neutral',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.ai_ranking_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_ranking_results ENABLE ROW LEVEL SECURITY;

-- RLS policies for ai_ranking_checks
CREATE POLICY "Users can view their own ranking checks"
  ON public.ai_ranking_checks FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can create their own ranking checks"
  ON public.ai_ranking_checks FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- RLS policies for ai_ranking_results (via check ownership)
CREATE POLICY "Users can view results of their own checks"
  ON public.ai_ranking_results FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.ai_ranking_checks
    WHERE ai_ranking_checks.id = ai_ranking_results.check_id
    AND ai_ranking_checks.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert results for their own checks"
  ON public.ai_ranking_results FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.ai_ranking_checks
    WHERE ai_ranking_checks.id = ai_ranking_results.check_id
    AND ai_ranking_checks.user_id = auth.uid()
  ));
