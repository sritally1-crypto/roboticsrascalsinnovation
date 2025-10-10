-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create storage bucket for reconstruction photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('reconstruction-photos', 'reconstruction-photos', false);

-- Create storage bucket for generated models
INSERT INTO storage.buckets (id, name, public)
VALUES ('generated-models', 'generated-models', true);

-- Create table to track reconstruction jobs
CREATE TABLE public.reconstruction_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  artifact_name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'uploading',
  photo_count INTEGER DEFAULT 0,
  storage_path TEXT,
  model_url TEXT,
  colab_notebook_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.reconstruction_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own reconstruction jobs"
  ON public.reconstruction_jobs
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own reconstruction jobs"
  ON public.reconstruction_jobs
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reconstruction jobs"
  ON public.reconstruction_jobs
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Storage policies for reconstruction photos
CREATE POLICY "Users can upload reconstruction photos"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'reconstruction-photos' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view their own reconstruction photos"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'reconstruction-photos'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Storage policies for generated models
CREATE POLICY "Anyone can view generated models"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'generated-models');

CREATE POLICY "Users can upload their generated models"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'generated-models'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Trigger for updated_at
CREATE TRIGGER update_reconstruction_jobs_updated_at
  BEFORE UPDATE ON public.reconstruction_jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();