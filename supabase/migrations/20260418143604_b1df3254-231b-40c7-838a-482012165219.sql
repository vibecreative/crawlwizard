-- Add position column for manual ordering of project pages
ALTER TABLE public.project_pages
ADD COLUMN IF NOT EXISTS position INTEGER;

-- Helper: hierarchical URL path sort key (depth, then path)
-- Initialize position based on URL path: home first, then alphabetically by path depth + path
WITH ranked AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (
      PARTITION BY project_id 
      ORDER BY 
        -- Home pages first
        CASE 
          WHEN regexp_replace(url, '^https?://[^/]+', '') IN ('', '/') THEN 0 
          ELSE 1 
        END,
        -- Then by path depth (shallower first)
        array_length(string_to_array(trim(both '/' from regexp_replace(url, '^https?://[^/]+', '')), '/'), 1) NULLS FIRST,
        -- Then alphabetically
        regexp_replace(url, '^https?://[^/]+', '')
    ) AS new_position
  FROM public.project_pages
)
UPDATE public.project_pages p
SET position = r.new_position
FROM ranked r
WHERE p.id = r.id;

-- Index for faster ordering
CREATE INDEX IF NOT EXISTS idx_project_pages_project_position 
ON public.project_pages(project_id, position);