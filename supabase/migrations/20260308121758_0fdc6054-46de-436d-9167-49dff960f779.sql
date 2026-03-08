
-- Brand knowledge table per project
CREATE TABLE public.project_brand_knowledge (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  company_description TEXT DEFAULT '',
  tone_of_voice TEXT DEFAULT '',
  target_audience TEXT DEFAULT '',
  usps TEXT DEFAULT '',
  key_messages TEXT DEFAULT '',
  preferred_terms TEXT DEFAULT '',
  avoided_terms TEXT DEFAULT '',
  example_texts TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id)
);

-- Enable RLS
ALTER TABLE public.project_brand_knowledge ENABLE ROW LEVEL SECURITY;

-- RLS: Users can manage brand knowledge for their own projects
CREATE POLICY "Users can view brand knowledge of own projects"
  ON public.project_brand_knowledge FOR SELECT
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_brand_knowledge.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can insert brand knowledge for own projects"
  ON public.project_brand_knowledge FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_brand_knowledge.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can update brand knowledge of own projects"
  ON public.project_brand_knowledge FOR UPDATE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_brand_knowledge.project_id AND projects.user_id = auth.uid()));

CREATE POLICY "Users can delete brand knowledge of own projects"
  ON public.project_brand_knowledge FOR DELETE
  USING (EXISTS (SELECT 1 FROM projects WHERE projects.id = project_brand_knowledge.project_id AND projects.user_id = auth.uid()));

-- Updated_at trigger
CREATE TRIGGER update_brand_knowledge_updated_at
  BEFORE UPDATE ON public.project_brand_knowledge
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
