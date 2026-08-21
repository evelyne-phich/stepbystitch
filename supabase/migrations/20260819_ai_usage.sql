-- ==============================================================================
-- StepByStitch: AI Usage Tracking, Quotas & Text Source Support
-- ==============================================================================

-- 1. UPDATE source_type CHECK CONSTRAINT ON TUTORIALS (support 'text')
ALTER TABLE public.tutorials DROP CONSTRAINT IF EXISTS tutorials_source_type_check;
ALTER TABLE public.tutorials ADD CONSTRAINT tutorials_source_type_check 
  CHECK (source_type IN ('pdf', 'screenshot', 'manuscrit', 'text'));

-- 2. CREATE TABLE AI_USAGE
CREATE TABLE IF NOT EXISTS public.ai_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('parse_pattern', 'translate_pattern')),
  input_tokens INTEGER NOT NULL DEFAULT 0,
  output_tokens INTEGER NOT NULL DEFAULT 0,
  total_tokens INTEGER NOT NULL DEFAULT 0,
  model_used TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.ai_usage ENABLE ROW LEVEL SECURITY;

-- AI Usage RLS Policies
DROP POLICY IF EXISTS "Users can view their own AI usage" ON public.ai_usage;
CREATE POLICY "Users can view their own AI usage"
  ON public.ai_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own AI usage" ON public.ai_usage;
CREATE POLICY "Users can insert their own AI usage"
  ON public.ai_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_usage_user_created ON public.ai_usage(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_tutorials_user_saved ON public.tutorials(user_id, saved_at DESC);

-- 3. HELPER FUNCTION: Count user tutorials
CREATE OR REPLACE FUNCTION public.get_user_pattern_count(p_user_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (SELECT COUNT(*) FROM public.tutorials WHERE user_id = p_user_id);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
