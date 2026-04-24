ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS banner_starts_at timestamptz;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS banner_ends_at timestamptz;
ALTER TABLE public.system_settings ADD COLUMN IF NOT EXISTS banner_variant text NOT NULL DEFAULT 'info';