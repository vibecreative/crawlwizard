import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Verify user
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check credits
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: creditsData } = await adminClient.rpc("get_remaining_credits", { _user_id: user.id });
    const remaining = creditsData?.remaining ?? 0;
    if (remaining <= 0) {
      return new Response(JSON.stringify({ error: "Geen AI-credits meer beschikbaar deze maand." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { url, pageContent, currentMeta } = await req.json();

    // Truncate content to avoid token limits
    const truncatedContent = (pageContent || "").substring(0, 4000);

    const systemPrompt = `Je bent een SEO-expert die geoptimaliseerde meta-tags schrijft voor webpagina's. Je schrijft in het Nederlands tenzij de pagina-inhoud duidelijk in een andere taal is.

Regels:
- Title Tag: max 60 karakters, bevat het belangrijkste keyword, wees specifiek en aantrekkelijk
- Meta Description: max 155 karakters, bevat een call-to-action of waardepropositie, wek nieuwsgierigheid
- OG Title: max 60 karakters, mag iets pakkender/socialer dan de title tag
- OG Description: max 200 karakters, focus op sociale deelbaarheid en klikbaarheid

Geef voor elk veld ook een korte uitleg (1 zin) waarom je deze keuze hebt gemaakt.`;

    const userPrompt = `Genereer geoptimaliseerde meta-tags voor deze pagina.

URL: ${url}

Huidige meta-tags:
- Title: ${currentMeta?.title || "(ontbreekt)"}
- Description: ${currentMeta?.description || "(ontbreekt)"}
- OG Title: ${currentMeta?.ogTitle || "(ontbreekt)"}
- OG Description: ${currentMeta?.ogDescription || "(ontbreekt)"}

Pagina-inhoud (samenvatting):
${truncatedContent}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_meta_tags",
              description: "Return optimized meta tag suggestions for a web page.",
              parameters: {
                type: "object",
                properties: {
                  title: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "The suggested title tag (max 60 chars)" },
                      explanation: { type: "string", description: "Brief explanation of why this title was chosen" },
                    },
                    required: ["value", "explanation"],
                    additionalProperties: false,
                  },
                  metaDescription: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "The suggested meta description (max 155 chars)" },
                      explanation: { type: "string", description: "Brief explanation" },
                    },
                    required: ["value", "explanation"],
                    additionalProperties: false,
                  },
                  ogTitle: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "The suggested OG title (max 60 chars)" },
                      explanation: { type: "string", description: "Brief explanation" },
                    },
                    required: ["value", "explanation"],
                    additionalProperties: false,
                  },
                  ogDescription: {
                    type: "object",
                    properties: {
                      value: { type: "string", description: "The suggested OG description (max 200 chars)" },
                      explanation: { type: "string", description: "Brief explanation" },
                    },
                    required: ["value", "explanation"],
                    additionalProperties: false,
                  },
                },
                required: ["title", "metaDescription", "ogTitle", "ogDescription"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_meta_tags" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Te veel verzoeken, probeer het later opnieuw." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Lovable AI-tegoed is op. Voeg credits toe in je workspace." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI gateway error");
    }

    const aiResult = await response.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error("No tool call in AI response");
    }

    const suggestions = JSON.parse(toolCall.function.arguments);

    // Deduct credit
    await adminClient.from("ai_credit_usage").insert({
      user_id: user.id,
      action_type: "meta_tag_generation",
      credits_used: 1,
    });

    return new Response(JSON.stringify(suggestions), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("generate-meta-tags error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
