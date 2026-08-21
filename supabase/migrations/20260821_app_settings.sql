-- ==============================================================================
-- StepByStitch: Dynamic App Settings & Admin Config Table
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users and service role to read system settings
DROP POLICY IF EXISTS "Allow public read access to app_settings" ON public.app_settings;
CREATE POLICY "Allow public read access to app_settings"
  ON public.app_settings FOR SELECT
  USING (true);

-- Insert default system settings
INSERT INTO public.app_settings (key, value, description)
VALUES 
  ('monthly_safety_cap', '500'::jsonb, 'Plafond mensuel de sécurité pour les imports de patrons (Fair Use)'),
  ('free_tier_max_patterns', '3'::jsonb, 'Nombre maximal de patrons inclus dans le forfait gratuit'),
  ('rate_limit_per_minute', '5'::jsonb, 'Nombre maximal de requêtes IA par minute par utilisateur')
ON CONFLICT (key) DO NOTHING;

-- Optional: Allow per-user monthly cap overrides in profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS monthly_cap_override INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS free_quota_override INTEGER DEFAULT NULL;
