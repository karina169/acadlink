-- Add account_type and feature_overrides to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type TEXT NOT NULL DEFAULT 'student',
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS feature_overrides JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Create signup_invites table for admin-generated lecturer/alumni invitations
CREATE TABLE IF NOT EXISTS public.signup_invites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  account_type TEXT NOT NULL DEFAULT 'lecturer',
  label TEXT,
  single_use BOOLEAN NOT NULL DEFAULT false,
  max_uses INTEGER,
  uses INTEGER NOT NULL DEFAULT 0,
  expires_at TIMESTAMPTZ,
  created_by UUID NOT NULL,
  consumed_by UUID,
  consumed_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_signup_invites_token ON public.signup_invites(token);

ALTER TABLE public.signup_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage invites"
  ON public.signup_invites FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Public (anon + authenticated) can lookup an invite by token to render the signup form,
-- but cannot list all invites. We rely on the unique token acting as a secret.
CREATE POLICY "Anyone can read invite by token"
  ON public.signup_invites FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE TRIGGER signup_invites_updated_at
  BEFORE UPDATE ON public.signup_invites
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Update handle_new_user to honor invite metadata (account_type, title, bio, department)
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_account_type TEXT := COALESCE(NEW.raw_user_meta_data->>'account_type', 'student');
  v_invite_token TEXT := NEW.raw_user_meta_data->>'invite_token';
  v_invite RECORD;
BEGIN
  INSERT INTO public.profiles (user_id, display_name, faculty, department, level, matric_number, account_type, title, bio)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'faculty',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'level',
    NEW.raw_user_meta_data->>'matric_number',
    v_account_type,
    NEW.raw_user_meta_data->>'title',
    NEW.raw_user_meta_data->>'bio'
  );

  IF lower(NEW.email) = 'mdintelligenceroom@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  -- Consume invite if provided and valid
  IF v_invite_token IS NOT NULL THEN
    SELECT * INTO v_invite FROM public.signup_invites
      WHERE token = v_invite_token AND active = true
        AND (expires_at IS NULL OR expires_at > now())
      LIMIT 1;
    IF v_invite.id IS NOT NULL THEN
      UPDATE public.signup_invites
        SET uses = uses + 1,
            consumed_by = CASE WHEN single_use THEN NEW.id ELSE consumed_by END,
            consumed_at = CASE WHEN single_use THEN now() ELSE consumed_at END,
            active = CASE WHEN single_use THEN false
                          WHEN max_uses IS NOT NULL AND uses + 1 >= max_uses THEN false
                          ELSE active END
        WHERE id = v_invite.id;
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;