-- Create discoveries table for public feed
CREATE TABLE public.discoveries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('3d_scan', 'ai_analysis')),
  media_url TEXT,
  thumbnail_url TEXT,
  metadata JSONB,
  likes_count INTEGER NOT NULL DEFAULT 0,
  comments_count INTEGER NOT NULL DEFAULT 0
);

-- Enable Row Level Security
ALTER TABLE public.discoveries ENABLE ROW LEVEL SECURITY;

-- Create policies for discoveries
CREATE POLICY "Anyone can view discoveries" 
ON public.discoveries 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own discoveries" 
ON public.discoveries 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own discoveries" 
ON public.discoveries 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own discoveries" 
ON public.discoveries 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_discoveries_updated_at
BEFORE UPDATE ON public.discoveries
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create likes table
CREATE TABLE public.discovery_likes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  discovery_id uuid NOT NULL REFERENCES public.discoveries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(discovery_id, user_id)
);

-- Enable RLS on likes
ALTER TABLE public.discovery_likes ENABLE ROW LEVEL SECURITY;

-- Likes policies
CREATE POLICY "Anyone can view likes" 
ON public.discovery_likes 
FOR SELECT 
USING (true);

CREATE POLICY "Users can like discoveries" 
ON public.discovery_likes 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike discoveries" 
ON public.discovery_likes 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update likes count
CREATE OR REPLACE FUNCTION public.update_discovery_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.discoveries 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.discovery_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.discoveries 
    SET likes_count = likes_count - 1 
    WHERE id = OLD.discovery_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to update likes count
CREATE TRIGGER update_likes_count_trigger
AFTER INSERT OR DELETE ON public.discovery_likes
FOR EACH ROW
EXECUTE FUNCTION public.update_discovery_likes_count();