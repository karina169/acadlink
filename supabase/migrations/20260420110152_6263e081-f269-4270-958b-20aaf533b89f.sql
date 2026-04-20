-- Helper: updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  faculty TEXT,
  department TEXT,
  level TEXT,
  matric_number TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles viewable by authenticated" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, faculty, department, level, matric_number)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email),
    NEW.raw_user_meta_data->>'faculty',
    NEW.raw_user_meta_data->>'department',
    NEW.raw_user_meta_data->>'level',
    NEW.raw_user_meta_data->>'matric_number'
  );
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Faculties / Departments / Courses
CREATE TABLE public.faculties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view faculties" ON public.faculties FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(name, faculty_id)
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view departments" ON public.departments FOR SELECT TO anon, authenticated USING (true);

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  units INT NOT NULL DEFAULT 3,
  level TEXT NOT NULL,
  semester TEXT NOT NULL DEFAULT '1st',
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT TO authenticated USING (true);

-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'group_admin', 'user');
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Admins insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE POLICY "Admins insert faculties" ON public.faculties FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete faculties" ON public.faculties FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert departments" ON public.departments FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete departments" ON public.departments FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete courses" ON public.courses FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Posts / Likes / Comments / Attachments
CREATE TABLE public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  tag TEXT NOT NULL DEFAULT 'discussion',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view posts" ON public.posts FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own posts" ON public.posts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users update own posts" ON public.posts FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users delete own posts" ON public.posts FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins delete any posts" ON public.posts FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_posts_updated_at BEFORE UPDATE ON public.posts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_posts_created_at ON public.posts(created_at DESC);

CREATE TABLE public.post_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size TEXT,
  file_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.post_attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view attachments" ON public.post_attachments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Owner adds attachments" ON public.post_attachments FOR INSERT TO authenticated WITH CHECK (
  EXISTS (SELECT 1 FROM public.posts WHERE id = post_id AND user_id = auth.uid())
);

CREATE TABLE public.post_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view likes" ON public.post_likes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own likes" ON public.post_likes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own likes" ON public.post_likes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view comments" ON public.comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users create own comments" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users delete own comments" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'system',
  title TEXT NOT NULL,
  body TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Course members / Chats
CREATE TABLE public.course_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(course_id, user_id)
);
ALTER TABLE public.course_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view course members" ON public.course_members FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users join courses" ON public.course_members FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users leave courses" ON public.course_members FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT,
  message_type TEXT NOT NULL DEFAULT 'text',
  file_url TEXT,
  file_name TEXT,
  reply_to UUID REFERENCES public.chat_messages(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view chat messages" ON public.chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users send chat messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE INDEX idx_chat_course_created ON public.chat_messages(course_id, created_at);

-- Campus News
CREATE TABLE public.campus_news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  pinned BOOLEAN NOT NULL DEFAULT false,
  published_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.campus_news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone view news" ON public.campus_news FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins insert news" ON public.campus_news FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update news" ON public.campus_news FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete news" ON public.campus_news FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.post_likes;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;

-- Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('post-files','post-files',true);
INSERT INTO storage.buckets (id, name, public) VALUES ('chat-files','chat-files',true);
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars','avatars',true);

CREATE POLICY "Anyone view post files" ON storage.objects FOR SELECT USING (bucket_id='post-files');
CREATE POLICY "Auth users upload post files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='post-files' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own post files" ON storage.objects FOR DELETE TO authenticated USING (bucket_id='post-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone view chat files" ON storage.objects FOR SELECT USING (bucket_id='chat-files');
CREATE POLICY "Auth users upload chat files" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='chat-files' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone view avatars" ON storage.objects FOR SELECT USING (bucket_id='avatars');
CREATE POLICY "Users upload own avatar" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users update own avatar" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id='avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Notification triggers
CREATE OR REPLACE FUNCTION public.notify_on_comment()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_owner UUID; commenter_name TEXT;
BEGIN
  SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner <> NEW.user_id THEN
    SELECT COALESCE(display_name,'Someone') INTO commenter_name FROM public.profiles WHERE user_id = NEW.user_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (post_owner,'message',commenter_name || ' commented on your post', LEFT(NEW.content,100), NEW.post_id::text);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_new_comment AFTER INSERT ON public.comments FOR EACH ROW EXECUTE FUNCTION public.notify_on_comment();

CREATE OR REPLACE FUNCTION public.notify_on_like()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE post_owner UUID; liker_name TEXT;
BEGIN
  SELECT user_id INTO post_owner FROM public.posts WHERE id = NEW.post_id;
  IF post_owner IS NOT NULL AND post_owner <> NEW.user_id THEN
    SELECT COALESCE(display_name,'Someone') INTO liker_name FROM public.profiles WHERE user_id = NEW.user_id;
    INSERT INTO public.notifications (user_id, type, title, body, link)
    VALUES (post_owner,'message',liker_name || ' liked your post', NULL, NEW.post_id::text);
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_new_like AFTER INSERT ON public.post_likes FOR EACH ROW EXECUTE FUNCTION public.notify_on_like();

-- SEED: Sokoto State University faculties + departments
INSERT INTO public.faculties (name) VALUES
  ('Faculty of Science'),
  ('Faculty of Arts'),
  ('Faculty of Social Sciences'),
  ('Faculty of Education'),
  ('Faculty of Management Sciences'),
  ('Faculty of Law'),
  ('Faculty of Agriculture'),
  ('Faculty of Engineering'),
  ('Faculty of Environmental Sciences'),
  ('Faculty of Basic Medical Sciences'),
  ('Faculty of Clinical Sciences'),
  ('Faculty of Communication')
ON CONFLICT DO NOTHING;

INSERT INTO public.departments (name, faculty_id)
SELECT d.name, f.id FROM public.faculties f
JOIN (VALUES
  ('Faculty of Science','Computer Science'),
  ('Faculty of Science','Mathematics'),
  ('Faculty of Science','Physics'),
  ('Faculty of Science','Chemistry'),
  ('Faculty of Science','Biology'),
  ('Faculty of Science','Microbiology'),
  ('Faculty of Science','Biochemistry'),
  ('Faculty of Science','Statistics'),
  ('Faculty of Arts','English'),
  ('Faculty of Arts','History'),
  ('Faculty of Arts','Arabic'),
  ('Faculty of Arts','Hausa'),
  ('Faculty of Arts','Islamic Studies'),
  ('Faculty of Social Sciences','Economics'),
  ('Faculty of Social Sciences','Political Science'),
  ('Faculty of Social Sciences','Sociology'),
  ('Faculty of Social Sciences','Geography'),
  ('Faculty of Social Sciences','Public Administration'),
  ('Faculty of Education','Educational Foundations'),
  ('Faculty of Education','Curriculum Studies'),
  ('Faculty of Education','Adult & Non-Formal Education'),
  ('Faculty of Education','Library & Information Science'),
  ('Faculty of Management Sciences','Accounting'),
  ('Faculty of Management Sciences','Business Administration'),
  ('Faculty of Management Sciences','Banking & Finance'),
  ('Faculty of Management Sciences','Marketing'),
  ('Faculty of Management Sciences','Entrepreneurship'),
  ('Faculty of Law','Public Law'),
  ('Faculty of Law','Private Law'),
  ('Faculty of Law','Islamic Law'),
  ('Faculty of Agriculture','Crop Science'),
  ('Faculty of Agriculture','Animal Science'),
  ('Faculty of Agriculture','Soil Science'),
  ('Faculty of Agriculture','Agricultural Economics'),
  ('Faculty of Agriculture','Forestry & Wildlife'),
  ('Faculty of Engineering','Civil Engineering'),
  ('Faculty of Engineering','Electrical Engineering'),
  ('Faculty of Engineering','Mechanical Engineering'),
  ('Faculty of Engineering','Chemical Engineering'),
  ('Faculty of Environmental Sciences','Architecture'),
  ('Faculty of Environmental Sciences','Estate Management'),
  ('Faculty of Environmental Sciences','Urban & Regional Planning'),
  ('Faculty of Environmental Sciences','Quantity Surveying'),
  ('Faculty of Basic Medical Sciences','Anatomy'),
  ('Faculty of Basic Medical Sciences','Physiology'),
  ('Faculty of Basic Medical Sciences','Medical Biochemistry'),
  ('Faculty of Clinical Sciences','Medicine & Surgery'),
  ('Faculty of Clinical Sciences','Nursing'),
  ('Faculty of Clinical Sciences','Pharmacy'),
  ('Faculty of Communication','Mass Communication'),
  ('Faculty of Communication','Information Technology')
) AS d(faculty_name, name) ON d.faculty_name = f.name
ON CONFLICT DO NOTHING;