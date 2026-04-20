-- 1. Seed one course-group per (department, level) + a "General" group per department.
-- We reuse the existing "courses" table as the chat-group container (already wired into chat_messages).
-- code = "<DEPT_SLUG>-<LEVEL>" or "<DEPT_SLUG>-GEN" to keep it unique.

INSERT INTO public.courses (code, title, level, semester, units, department_id)
SELECT
  upper(regexp_replace(d.name, '[^a-zA-Z0-9]+', '', 'g')) || '-' || lvl.level AS code,
  d.name || ' ' || lvl.level || 'L' AS title,
  lvl.level,
  '1st',
  0,
  d.id
FROM public.departments d
CROSS JOIN (VALUES ('100'), ('200'), ('300'), ('400'), ('500')) AS lvl(level)
WHERE NOT EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.department_id = d.id
    AND c.code = upper(regexp_replace(d.name, '[^a-zA-Z0-9]+', '', 'g')) || '-' || lvl.level
);

INSERT INTO public.courses (code, title, level, semester, units, department_id)
SELECT
  upper(regexp_replace(d.name, '[^a-zA-Z0-9]+', '', 'g')) || '-GEN' AS code,
  d.name || ' — General' AS title,
  'ALL',
  '1st',
  0,
  d.id
FROM public.departments d
WHERE NOT EXISTS (
  SELECT 1 FROM public.courses c
  WHERE c.department_id = d.id
    AND c.code = upper(regexp_replace(d.name, '[^a-zA-Z0-9]+', '', 'g')) || '-GEN'
);

-- 2. Backfill memberships for existing users.
INSERT INTO public.course_members (course_id, user_id)
SELECT c.id, p.user_id
FROM public.profiles p
JOIN public.departments d ON d.name = p.department
JOIN public.courses c ON c.department_id = d.id
WHERE p.department IS NOT NULL
  AND (
    (p.level IS NOT NULL AND c.level = p.level)
    OR c.level = 'ALL'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.course_members cm
    WHERE cm.course_id = c.id AND cm.user_id = p.user_id
  );

-- 3. Trigger: auto-join new users to their dept+level group and dept General group.
CREATE OR REPLACE FUNCTION public.auto_join_default_groups()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.department IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.course_members (course_id, user_id)
  SELECT c.id, NEW.user_id
  FROM public.departments d
  JOIN public.courses c ON c.department_id = d.id
  WHERE d.name = NEW.department
    AND (c.level = 'ALL' OR (NEW.level IS NOT NULL AND c.level = NEW.level))
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS auto_join_default_groups_trigger ON public.profiles;
CREATE TRIGGER auto_join_default_groups_trigger
AFTER INSERT OR UPDATE OF department, level ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.auto_join_default_groups();
