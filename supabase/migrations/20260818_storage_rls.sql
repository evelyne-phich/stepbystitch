-- ==============================================================================
-- StepByStitch: Private Cloud Storage Configuration & Supabase Storage RLS
-- ==============================================================================

-- 1. Create the 'patterns' bucket in private mode (if not existing)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'patterns',
  'patterns',
  false,
  52428800, -- 50 MB limit per file
  ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 52428800,
  allowed_mime_types = ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Private read of patterns by owner" ON storage.objects;
DROP POLICY IF EXISTS "Private upload of patterns by owner" ON storage.objects;
DROP POLICY IF EXISTS "Private update of patterns by owner" ON storage.objects;
DROP POLICY IF EXISTS "Private delete of patterns by owner" ON storage.objects;
DROP POLICY IF EXISTS "Lecture privée des patrons par leur propriétaire" ON storage.objects;
DROP POLICY IF EXISTS "Upload privé des patrons par leur propriétaire" ON storage.objects;
DROP POLICY IF EXISTS "Modification privée des patrons par leur propriétaire" ON storage.objects;
DROP POLICY IF EXISTS "Suppression privée des patrons par leur propriétaire" ON storage.objects;

-- 3. Strict RLS policies on storage.objects for the 'patterns' bucket
-- Storage path structure MUST be prefixed with user ID: '<user_id>/<tutorial_id>/<filename>'

-- SELECT / DOWNLOAD Policy
CREATE POLICY "Private read of patterns by owner"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'patterns' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- INSERT / UPLOAD Policy
CREATE POLICY "Private upload of patterns by owner"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'patterns' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- UPDATE Policy
CREATE POLICY "Private update of patterns by owner"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'patterns' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- DELETE Policy
CREATE POLICY "Private delete of patterns by owner"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'patterns' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);
