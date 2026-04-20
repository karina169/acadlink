-- Phase 2: group admin + chat permissions + admin panel CRUD

-- Allow group admins to create courses (which act as chat groups per level)
CREATE POLICY "Group admins create courses"
ON public.courses FOR INSERT TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'group_admin'));

CREATE POLICY "Group admins update courses"
ON public.courses FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'group_admin') OR public.has_role(auth.uid(), 'admin'));

-- Admins can update faculties/departments
CREATE POLICY "Admins update faculties"
ON public.faculties FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins update departments"
ON public.departments FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

-- Allow message authors to delete own chat messages; admins delete any
CREATE POLICY "Users delete own chat messages"
ON public.chat_messages FOR DELETE TO authenticated
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'group_admin'));

-- Indexes for performance (launch-ready)
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_tag ON public.posts(tag);
CREATE INDEX IF NOT EXISTS idx_post_likes_post ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_post ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_post_attachments_post ON public.post_attachments(post_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_course ON public.chat_messages(course_id, created_at);
CREATE INDEX IF NOT EXISTS idx_course_members_user ON public.course_members(user_id);
CREATE INDEX IF NOT EXISTS idx_course_members_course ON public.course_members(course_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, read);
CREATE INDEX IF NOT EXISTS idx_courses_dept_level ON public.courses(department_id, level);
CREATE INDEX IF NOT EXISTS idx_departments_faculty ON public.departments(faculty_id);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles(user_id);

-- Storage policies for chat-files (bucket exists; ensure write policies)
DO $$ BEGIN
  CREATE POLICY "Auth users upload chat files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'chat-files');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone read chat files"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'chat-files');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth users upload post files"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'post-files');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone read post files"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'post-files');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Auth users upload avatars"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Anyone read avatars"
  ON storage.objects FOR SELECT TO authenticated, anon
  USING (bucket_id = 'avatars');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY "Owners update own avatar"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;