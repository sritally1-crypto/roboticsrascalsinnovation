import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const HYPER3D_API_KEY = Deno.env.get('HYPER3D_API_KEY');
    if (!HYPER3D_API_KEY) {
      throw new Error('HYPER3D_API_KEY not configured');
    }

    const formData = await req.formData();
    const action = formData.get('action') as string;

    // Submit reconstruction task
    if (action === 'submit') {
      const artifactName = formData.get('artifactName') as string;
      
      console.log('Submitting reconstruction to Rodin for:', artifactName);

      // Create new FormData for Rodin API
      const rodinFormData = new FormData();
      
      // Add all images
      let imageCount = 0;
      for (const [key, value] of formData.entries()) {
        if (key.startsWith('image_')) {
          rodinFormData.append('images', value);
          imageCount++;
        }
      }

      console.log(`Processing ${imageCount} images`);

      // Add optional prompt
      rodinFormData.append('prompt', `High-quality 3D reconstruction of ${artifactName}, archaeological artifact`);
      rodinFormData.append('geometry_file_format', 'glb');

      // Submit to Rodin API
      const response = await fetch('https://hyperhuman.deemos.com/api/v2/rodin', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HYPER3D_API_KEY}`,
        },
        body: rodinFormData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Rodin API error:', response.status, errorText);
        throw new Error(`Rodin API error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log('Rodin task submitted:', result);

      return new Response(JSON.stringify({ 
        taskId: result.task_uuid,
        status: 'submitted'
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check task status
    if (action === 'status') {
      const taskId = formData.get('taskId') as string;
      
      console.log('Checking status for task:', taskId);

      const response = await fetch(`https://hyperhuman.deemos.com/api/v2/rodin/${taskId}`, {
        headers: {
          'Authorization': `Bearer ${HYPER3D_API_KEY}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Rodin status check error:', response.status, errorText);
        throw new Error(`Status check error: ${response.status}`);
      }

      const result = await response.json();
      console.log('Task status:', result.status);

      // Return status and model URL if complete
      return new Response(JSON.stringify({
        status: result.status,
        progress: result.progress || 0,
        modelUrl: result.model?.glb_url,
        viewerUrl: result.viewer_url,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Error in rodin-reconstruct:', error);
    return new Response(JSON.stringify({ 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
