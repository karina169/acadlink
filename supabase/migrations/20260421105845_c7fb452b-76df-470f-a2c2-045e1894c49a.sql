-- Update signup handler to auto-promote the designated admin email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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

  -- Auto-grant admin role to the designated owner email
  IF lower(NEW.email) = 'mdintelligenceroom@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin'::public.app_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- If the account already exists, grant admin role now
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) = 'mdintelligenceroom@gmail.com'
ON CONFLICT (user_id, role) DO NOTHING;
