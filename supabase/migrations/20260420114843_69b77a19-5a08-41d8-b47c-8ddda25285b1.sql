ALTER TABLE public.course_members
ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

-- Allow users to update their own membership row (for last_seen_at)
DROP POLICY IF EXISTS "Users update own membership" ON public.course_members;
CREATE POLICY "Users update own membership"
ON public.course_members
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_course_members_user_course
ON public.course_members(user_id, course_id);
