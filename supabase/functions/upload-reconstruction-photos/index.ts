import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get authenticated user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const formData = await req.formData();
    const artifactName = formData.get('artifactName') as string;
    const files = formData.getAll('photos') as File[];

    if (!artifactName || files.length === 0) {
      return new Response(JSON.stringify({ error: 'Missing artifact name or photos' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log(`Processing ${files.length} photos for artifact: ${artifactName}`);

    // Create reconstruction job
    const { data: job, error: jobError } = await supabase
      .from('reconstruction_jobs')
      .insert({
        user_id: user.id,
        artifact_name: artifactName,
        status: 'uploading',
        photo_count: files.length,
      })
      .select()
      .single();

    if (jobError) {
      console.error('Failed to create job:', jobError);
      return new Response(JSON.stringify({ error: 'Failed to create reconstruction job' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const storagePath = `${user.id}/${job.id}`;
    const uploadedFiles: string[] = [];

    // Upload photos to storage
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const filePath = `${storagePath}/photo_${i + 1}.jpg`;
      
      const { error: uploadError } = await supabase.storage
        .from('reconstruction-photos')
        .upload(filePath, file, {
          contentType: file.type,
          upsert: false,
        });

      if (uploadError) {
        console.error(`Failed to upload file ${i + 1}:`, uploadError);
        continue;
      }

      uploadedFiles.push(filePath);
    }

    // Update job with storage path
    await supabase
      .from('reconstruction_jobs')
      .update({
        storage_path: storagePath,
        status: 'ready_for_processing',
        photo_count: uploadedFiles.length,
      })
      .eq('id', job.id);

    // Generate signed URLs for Colab access
    const signedUrls = await Promise.all(
      uploadedFiles.map(async (path) => {
        const { data } = await supabase.storage
          .from('reconstruction-photos')
          .createSignedUrl(path, 7200); // 2 hours
        return data?.signedUrl;
      })
    );

    console.log(`Successfully uploaded ${uploadedFiles.length} photos for job ${job.id}`);

    return new Response(
      JSON.stringify({
        jobId: job.id,
        photoCount: uploadedFiles.length,
        storagePath,
        signedUrls: signedUrls.filter(Boolean),
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing photos:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});