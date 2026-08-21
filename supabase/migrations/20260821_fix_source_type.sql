-- ==============================================================================
-- StepByStitch: Standardize source_type constraint to strictly 'pdf', 'image', 'text'
-- ==============================================================================

-- 1. Migrate any existing legacy rows to the standard 'image' and 'text' types
UPDATE public.tutorials SET source_type = 'image' WHERE source_type = 'screenshot';
UPDATE public.tutorials SET source_type = 'text' WHERE source_type = 'manuscrit';

-- 2. Clean & apply strict CHECK constraint
ALTER TABLE public.tutorials DROP CONSTRAINT IF EXISTS tutorials_source_type_check;

ALTER TABLE public.tutorials ADD CONSTRAINT tutorials_source_type_check 
  CHECK (source_type IN ('pdf', 'image', 'text'));
