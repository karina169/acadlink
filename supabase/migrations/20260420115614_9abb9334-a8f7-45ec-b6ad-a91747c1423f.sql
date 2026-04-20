-- 1. Schema changes to courses (groups) table
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS scope TEXT NOT NULL DEFAULT 'level',
  ADD COLUMN IF NOT EXISTS faculty_id UUID REFERENCES public.faculties(id) ON DELETE CASCADE;

-- Allow department_id to be null (faculty-general & university groups have no dept)
ALTER TABLE public.courses ALTER COLUMN department_id DROP NOT NULL;

-- 2. RLS: allow group admins (and admins) to update groups they manage
DROP POLICY IF EXISTS "Group admins update courses" ON public.courses;
CREATE POLICY "Group admins update courses"
  ON public.courses FOR UPDATE TO authenticated
  USING (has_role(auth.uid(), 'group_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Allow admins/group_admins to delete groups
DROP POLICY IF EXISTS "Admins delete courses" ON public.courses;
CREATE POLICY "Admins delete courses"
  ON public.courses FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'group_admin'::app_role));

-- Allow admins to add/remove other users from groups (for membership management)
CREATE POLICY "Admins manage memberships"
  ON public.course_members FOR INSERT TO authenticated
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins remove memberships"
  ON public.course_members FOR DELETE TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- 3. Seed the university-wide general group (idempotent)
INSERT INTO public.courses (code, title, display_name, level, semester, units, department_id, faculty_id, scope)
SELECT 'UNI-GEN', 'AcadLink General', 'AcadLink General', 'ALL', '1st', 0, NULL, NULL, 'university'
WHERE NOT EXISTS (SELECT 1 FROM public.courses WHERE scope = 'university');

-- 4. Seed faculty-general groups for every faculty (idempotent)
INSERT INTO public.courses (code, title, display_name, level, semester, units, department_id, faculty_id, scope)
SELECT
  'FAC-' || UPPER(REGEXP_REPLACE(f.name, '[^a-zA-Z0-9]', '', 'g')) || '-GEN',
  f.name || ' General',
  f.name || ' General',
  'ALL', '1st', 0, NULL, f.id, 'faculty'
FROM public.faculties f
WHERE NOT EXISTS (
  SELECT 1 FROM public.courses c WHERE c.scope = 'faculty' AND c.faculty_id = f.id
);

-- 5. Updated auto-join trigger: department+level, department-general, faculty-general, university
CREATE OR REPLACE FUNCTION public.auto_join_default_groups()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE user_faculty_id UUID;
BEGIN
  -- Always join university-wide group
  INSERT INTO public.course_members (course_id, user_id)
  SELECT c.id, NEW.user_id FROM public.courses c WHERE c.scope = 'university'
  ON CONFLICT DO NOTHING;

  IF NEW.faculty IS NOT NULL THEN
    SELECT id INTO user_faculty_id FROM public.faculties WHERE name = NEW.faculty LIMIT 1;
    IF user_faculty_id IS NOT NULL THEN
      INSERT INTO public.course_members (course_id, user_id)
      SELECT c.id, NEW.user_id FROM public.courses c
      WHERE c.scope = 'faculty' AND c.faculty_id = user_faculty_id
      ON CONFLICT DO NOTHING;
    END IF;
  END IF;

  IF NEW.department IS NOT NULL THEN
    -- Department-level + department-general groups (existing behavior)
    INSERT INTO public.course_members (course_id, user_id)
    SELECT c.id, NEW.user_id
    FROM public.departments d
    JOIN public.courses c ON c.department_id = d.id
    WHERE d.name = NEW.department
      AND (c.level = 'ALL' OR (NEW.level IS NOT NULL AND c.level = NEW.level))
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- 6. Make sure the trigger exists on profiles
DROP TRIGGER IF EXISTS auto_join_groups_trigger ON public.profiles;
CREATE TRIGGER auto_join_groups_trigger
  AFTER INSERT OR UPDATE OF department, level, faculty ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_join_default_groups();

-- 7. Backfill: auto-join all existing users into the new faculty + university groups
INSERT INTO public.course_members (course_id, user_id)
SELECT c.id, p.user_id
FROM public.profiles p
CROSS JOIN public.courses c
WHERE c.scope = 'university'
ON CONFLICT DO NOTHING;

INSERT INTO public.course_members (course_id, user_id)
SELECT c.id, p.user_id
FROM public.profiles p
JOIN public.faculties f ON f.name = p.faculty
JOIN public.courses c ON c.scope = 'faculty' AND c.faculty_id = f.id
ON CONFLICT DO NOTHING;