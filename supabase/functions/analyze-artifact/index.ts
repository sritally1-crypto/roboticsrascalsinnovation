import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageData, scanData } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log("Starting artifact analysis...");

    // Build the prompt based on available data
    let prompt = `You are an expert archaeologist and artifact analyst. Analyze this artifact image in extreme detail and provide a comprehensive professional analysis.

CRITICAL: Base your analysis ONLY on what you can actually see in the image. Be specific and accurate.

Provide your analysis in the following JSON format:
{
  "material": "Detailed material composition based on visual analysis",
  "confidence": <number 0-100>,
  "period": "Historical period with specific date range",
  "culture": "Cultural origin",
  "function": "Artifact's purpose and use",
  "location": "Geographic origin with probability",
  "dimensions": {
    "length": <estimated in mm>,
    "width": <estimated in mm>,
    "height": <estimated in mm>,
    "volume": <estimated in cubic cm>,
    "accuracy": "estimation method"
  },
  "condition": {
    "overall": "condition description",
    "damage": ["list of visible damage"],
    "preservation": <0-1 score>,
    "recommendations": ["conservation recommendations"]
  },
  "verification": {
    "datasetSize": "reference database info",
    "validationScore": <0-1>,
    "crossReferences": <number>,
    "uncertainties": ["list of uncertainties"]
  },
  "matches": [
    {
      "name": "Similar artifact name",
      "similarity": <0-100>,
      "museum": "Museum name",
      "period": "date range",
      "confidence": <0-100>,
      "verified": <boolean>
    }
  ],
  "detailedAnalysis": "A comprehensive paragraph describing the artifact, its significance, and notable features"
}`;

    if (scanData) {
      prompt += `\n\nAdditional 3D scan data available: ${JSON.stringify(scanData)}`;
    }

    const messages: any[] = [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: prompt
          }
        ]
      }
    ];

    // Add image if provided
    if (imageData) {
      messages[0].content.push({
        type: "image_url",
        image_url: {
          url: imageData
        }
      });
    }

    console.log("Calling Gemini AI for analysis...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
        temperature: 0.3, // Lower temperature for more factual responses
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log("AI analysis complete");

    let analysisText = data.choices?.[0]?.message?.content;
    
    // Extract JSON from the response (handle markdown code blocks)
    if (analysisText.includes("```json")) {
      analysisText = analysisText.split("```json")[1].split("```")[0].trim();
    } else if (analysisText.includes("```")) {
      analysisText = analysisText.split("```")[1].split("```")[0].trim();
    }

    const analysis = JSON.parse(analysisText);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-artifact function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Analysis failed" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
