-- Verified flag for users
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN NOT NULL DEFAULT false;

-- Multi-department targeting for handouts and past questions
ALTER TABLE public.handouts ADD COLUMN IF NOT EXISTS target_departments UUID[] NOT NULL DEFAULT '{}';
ALTER TABLE public.past_questions ADD COLUMN IF NOT EXISTS target_departments UUID[] NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_handouts_target_depts ON public.handouts USING GIN (target_departments);
CREATE INDEX IF NOT EXISTS idx_past_questions_target_depts ON public.past_questions USING GIN (target_departments);

-- Allow admins to update profiles (for verified toggle)
DROP POLICY IF EXISTS "Admins update any profile" ON public.profiles;
CREATE POLICY "Admins update any profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));