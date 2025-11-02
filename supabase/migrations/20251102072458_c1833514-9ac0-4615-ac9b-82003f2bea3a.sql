-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  display_name text,
  avatar_url text,
  bio text,
  is_professional boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles are viewable by everyone
CREATE POLICY "Profiles are viewable by everyone"
ON public.profiles FOR SELECT
USING (true);

-- Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- Create archived_artifacts table for saving user work
CREATE TABLE public.archived_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  artifact_type text NOT NULL, -- '3d_model', 'scan', 'reconstruction'
  model_url text,
  thumbnail_url text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS on archived_artifacts
ALTER TABLE public.archived_artifacts ENABLE ROW LEVEL SECURITY;

-- Users can view their own archived artifacts
CREATE POLICY "Users can view their own artifacts"
ON public.archived_artifacts FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own artifacts
CREATE POLICY "Users can insert their own artifacts"
ON public.archived_artifacts FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own artifacts
CREATE POLICY "Users can update their own artifacts"
ON public.archived_artifacts FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own artifacts
CREATE POLICY "Users can delete their own artifacts"
ON public.archived_artifacts FOR DELETE
USING (auth.uid() = user_id);

-- Create donations table
CREATE TABLE public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  donor_name text,
  donor_email text,
  message text,
  status text DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on donations
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Anyone can create donations (for anonymous donations)
CREATE POLICY "Anyone can create donations"
ON public.donations FOR INSERT
WITH CHECK (true);

-- Users can view their own donations
CREATE POLICY "Users can view their own donations"
ON public.donations FOR SELECT
USING (auth.uid() = user_id OR user_id IS NULL);

-- Update discoveries table to require user_id (not nullable)
ALTER TABLE public.discoveries ALTER COLUMN user_id SET NOT NULL;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_archived_artifacts_updated_at
  BEFORE UPDATE ON public.archived_artifacts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup (create profile automatically)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, username)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', new.email),
    LOWER(SPLIT_PART(new.email, '@', 1))
  );
  RETURN new;
END;
$$;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();