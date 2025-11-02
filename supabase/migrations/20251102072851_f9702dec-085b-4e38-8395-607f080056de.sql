-- First, delete discoveries without matching profiles
DELETE FROM public.discoveries 
WHERE user_id NOT IN (SELECT id FROM public.profiles);

-- Now add the foreign key
ALTER TABLE public.discoveries 
ADD CONSTRAINT fk_user_profile 
FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;