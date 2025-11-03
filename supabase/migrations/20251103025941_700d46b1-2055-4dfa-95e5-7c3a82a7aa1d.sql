-- Insert profiles for any existing auth users who don't have profiles yet
INSERT INTO public.profiles (id, display_name, username)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'display_name', au.email) as display_name,
  LOWER(SPLIT_PART(au.email, '@', 1)) as username
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;