
-- =====================
-- HANDOUTS
-- =====================
CREATE TABLE public.handouts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  level TEXT,
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  file_type TEXT,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.handouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view handouts" ON public.handouts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert handouts" ON public.handouts FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update handouts" ON public.handouts FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete handouts" ON public.handouts FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_handouts_updated_at BEFORE UPDATE ON public.handouts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_handouts_dept_level ON public.handouts(department_id, level);
CREATE INDEX idx_handouts_course ON public.handouts(course_id);

-- =====================
-- PAST QUESTIONS
-- =====================
CREATE TABLE public.past_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  level TEXT,
  title TEXT NOT NULL,
  session TEXT,
  semester TEXT,
  pages INTEGER,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  downloads INTEGER NOT NULL DEFAULT 0,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.past_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view past_questions" ON public.past_questions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert past_questions" ON public.past_questions FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update past_questions" ON public.past_questions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete past_questions" ON public.past_questions FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_pastq_updated_at BEFORE UPDATE ON public.past_questions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_pastq_dept_level ON public.past_questions(department_id, level);

-- =====================
-- TIMETABLE
-- =====================
CREATE TABLE public.timetable_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  department_id UUID REFERENCES public.departments(id) ON DELETE CASCADE,
  level TEXT,
  semester TEXT NOT NULL DEFAULT '1st',
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_code TEXT,
  course_title TEXT,
  day_of_week TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT NOT NULL,
  venue TEXT,
  lecturer TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view timetable" ON public.timetable_entries FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert timetable" ON public.timetable_entries FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update timetable" ON public.timetable_entries FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete timetable" ON public.timetable_entries FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_timetable_updated_at BEFORE UPDATE ON public.timetable_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_timetable_dept_level ON public.timetable_entries(department_id, level, semester);

-- =====================
-- STUDENT RESULTS
-- =====================
CREATE TABLE public.student_results (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL,
  session TEXT NOT NULL,
  semester TEXT NOT NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  course_code TEXT NOT NULL,
  course_title TEXT,
  units INTEGER NOT NULL DEFAULT 3,
  score NUMERIC,
  grade TEXT NOT NULL,
  uploaded_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students view own results" ON public.student_results FOR SELECT TO authenticated
  USING (auth.uid() = student_id OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins insert results" ON public.student_results FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update results" ON public.student_results FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete results" ON public.student_results FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER trg_results_updated_at BEFORE UPDATE ON public.student_results
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_results_student ON public.student_results(student_id, session, semester);

-- =====================
-- STORAGE BUCKET for academic files (handouts, past questions)
-- =====================
INSERT INTO storage.buckets (id, name, public) VALUES ('academic-files', 'academic-files', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read academic-files" ON storage.objects FOR SELECT
  USING (bucket_id = 'academic-files');
CREATE POLICY "Admins upload academic-files" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'academic-files' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins update academic-files" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'academic-files' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "Admins delete academic-files" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'academic-files' AND public.has_role(auth.uid(), 'admin'::public.app_role));
