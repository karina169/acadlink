-- Boost columns
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS boosted_until timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS boosted_until timestamptz;

CREATE INDEX IF NOT EXISTS idx_posts_boosted ON public.posts (boosted_until DESC NULLS LAST);

-- Allow admins to update any post (for boosting)
DO $$ BEGIN
  CREATE POLICY "Admins update any posts" ON public.posts FOR UPDATE TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- System settings (single-row config)
CREATE TABLE IF NOT EXISTS public.system_settings (
  id boolean PRIMARY KEY DEFAULT true,
  site_name text NOT NULL DEFAULT 'AcadLink',
  tagline text NOT NULL DEFAULT 'Your campus, connected.',
  reels_enabled boolean NOT NULL DEFAULT true,
  voice_notes_enabled boolean NOT NULL DEFAULT true,
  live_events_enabled boolean NOT NULL DEFAULT true,
  registration_open boolean NOT NULL DEFAULT true,
  default_post_tag text NOT NULL DEFAULT 'discussion',
  max_post_length int NOT NULL DEFAULT 2000,
  announcement_banner text,
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT system_settings_singleton CHECK (id = true)
);

INSERT INTO public.system_settings (id) VALUES (true) ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY "Anyone view system settings" ON public.system_settings FOR SELECT TO authenticated USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins update system settings" ON public.system_settings FOR UPDATE TO authenticated
    USING (has_role(auth.uid(), 'admin'::app_role))
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Admins insert system settings" ON public.system_settings FOR INSERT TO authenticated
    WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TRIGGER update_system_settings_updated_at
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();