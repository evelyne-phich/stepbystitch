-- ==============================================================================
-- StepByStitch: Initial Database Schema & Row Level Security (RLS)
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLE PROFILES (Linked to auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  langue_preferee TEXT NOT NULL DEFAULT 'fr',
  full_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles RLS Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Automatic trigger to create profile record when a new user signs up in auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, langue_preferee, full_name)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'langue_preferee', 'fr'),
    COALESCE(new.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. TABLE TUTORIALS (Saved Crochet Patterns)
CREATE TABLE IF NOT EXISTS public.tutorials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('pdf', 'screenshot', 'manuscrit')),
  file_path TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  title TEXT NOT NULL,
  note TEXT,
  raw_content TEXT,
  raw_content_language TEXT DEFAULT 'en',
  stitch TEXT,
  level TEXT,
  project_type TEXT,
  materials JSONB DEFAULT '[]'::jsonb,
  gauge TEXT,
  saved_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.tutorials ENABLE ROW LEVEL SECURITY;

-- Tutorials RLS Policies
DROP POLICY IF EXISTS "Users can view only their own patterns" ON public.tutorials;
CREATE POLICY "Users can view only their own patterns"
  ON public.tutorials FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own patterns" ON public.tutorials;
CREATE POLICY "Users can create their own patterns"
  ON public.tutorials FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own patterns" ON public.tutorials;
CREATE POLICY "Users can update their own patterns"
  ON public.tutorials FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own patterns" ON public.tutorials;
CREATE POLICY "Users can delete their own patterns"
  ON public.tutorials FOR DELETE
  USING (auth.uid() = user_id);

-- 4. TABLE CHECKLIST_ITEMS (Interactive Checkable & Annotable Steps)
CREATE TABLE IF NOT EXISTS public.checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES public.tutorials(id) ON DELETE CASCADE NOT NULL,
  label TEXT NOT NULL,
  section TEXT DEFAULT 'General',
  order_index INTEGER NOT NULL DEFAULT 0,
  checked BOOLEAN NOT NULL DEFAULT false,
  note TEXT,
  edited_by_user BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.checklist_items ENABLE ROW LEVEL SECURITY;

-- Checklist Items RLS Policies (via join with tutorial.user_id)
DROP POLICY IF EXISTS "Users can view checklist items for their own patterns" ON public.checklist_items;
CREATE POLICY "Users can view checklist items for their own patterns"
  ON public.checklist_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tutorials
      WHERE tutorials.id = checklist_items.tutorial_id
      AND tutorials.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create checklist items for their own patterns" ON public.checklist_items;
CREATE POLICY "Users can create checklist items for their own patterns"
  ON public.checklist_items FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tutorials
      WHERE tutorials.id = checklist_items.tutorial_id
      AND tutorials.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update checklist items for their own patterns" ON public.checklist_items;
CREATE POLICY "Users can update checklist items for their own patterns"
  ON public.checklist_items FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tutorials
      WHERE tutorials.id = checklist_items.tutorial_id
      AND tutorials.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can delete checklist items for their own patterns" ON public.checklist_items;
CREATE POLICY "Users can delete checklist items for their own patterns"
  ON public.checklist_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.tutorials
      WHERE tutorials.id = checklist_items.tutorial_id
      AND tutorials.user_id = auth.uid()
    )
  );

-- 5. TABLE TRANSLATIONS (Cached Technical Pattern Translations)
CREATE TABLE IF NOT EXISTS public.translations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES public.tutorials(id) ON DELETE CASCADE NOT NULL,
  target_language TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'done' CHECK (status IN ('pending', 'processing', 'done', 'failed')),
  content JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  UNIQUE(tutorial_id, target_language)
);

ALTER TABLE public.translations ENABLE ROW LEVEL SECURITY;

-- Translations RLS Policies
DROP POLICY IF EXISTS "Users can view translations for their own patterns" ON public.translations;
CREATE POLICY "Users can view translations for their own patterns"
  ON public.translations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tutorials
      WHERE tutorials.id = translations.tutorial_id
      AND tutorials.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can create translations for their own patterns" ON public.translations;
CREATE POLICY "Users can create translations for their own patterns"
  ON public.translations FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.tutorials
      WHERE tutorials.id = translations.tutorial_id
      AND tutorials.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can update translations for their own patterns" ON public.translations;
CREATE POLICY "Users can update translations for their own patterns"
  ON public.translations FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.tutorials
      WHERE tutorials.id = translations.tutorial_id
      AND tutorials.user_id = auth.uid()
    )
  );

-- 6. TABLE PROGRESS_COUNTERS (Optional Stitch / Row Counter)
CREATE TABLE IF NOT EXISTS public.progress_counters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tutorial_id UUID REFERENCES public.tutorials(id) ON DELETE CASCADE NOT NULL UNIQUE,
  current_row INTEGER NOT NULL DEFAULT 1,
  current_stitch INTEGER NOT NULL DEFAULT 0,
  total_rows INTEGER,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.progress_counters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own counter" ON public.progress_counters;
CREATE POLICY "Users can manage their own counter"
  ON public.progress_counters FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.tutorials
      WHERE tutorials.id = progress_counters.tutorial_id
      AND tutorials.user_id = auth.uid()
    )
  );

-- 7. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_tutorials_user_id ON public.tutorials(user_id);
CREATE INDEX IF NOT EXISTS idx_tutorials_saved_at ON public.tutorials(saved_at DESC);
CREATE INDEX IF NOT EXISTS idx_checklist_items_tutorial ON public.checklist_items(tutorial_id, order_index ASC);
CREATE INDEX IF NOT EXISTS idx_translations_tutorial ON public.translations(tutorial_id, target_language);
