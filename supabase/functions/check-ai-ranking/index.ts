import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const AI_GATEWAY_URL = "https://ai.gateway.lovable.dev/v1/chat/completions";

const MODELS = [
  { id: "google/gemini-2.5-pro", label: "Gemini Pro" },
  { id: "google/gemini-2.5-flash", label: "Gemini Flash" },
  { id: "openai/gpt-5", label: "GPT-5" },
  { id: "openai/gpt-5-mini", label: "GPT-5 Mini" },
];

// Each question costs 4 credits (1 per model; analysis calls use cheap model and are free)
const CREDITS_PER_QUESTION = 4;

interface RankingRequest {
  questions: string[];
  domain: string;
  pageId: string;
}

async function checkCredits(supabase: any, userId: string, creditsNeeded: number) {
  const { data, error } = await supabase.rpc('get_remaining_credits', { _user_id: userId });
  if (error) throw new Error('Kon credits niet controleren');
  const credits = typeof data === 'string' ? JSON.parse(data) : data;
  if (credits.remaining < creditsNeeded) return { allowed: false, ...credits };
  return { allowed: true, ...credits };
}

async function logCreditUsage(supabase: any, userId: string, actionType: string, credits: number) {
  await supabase.from('ai_credit_usage').insert({ user_id: userId, action_type: actionType, credits_used: credits });
}

async function askModel(
  apiKey: string,
  modelId: string,
  question: string,
  domain: string
) {
  try {
    const questionResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: "Je bent een behulpzame AI-assistent. Beantwoord de vraag zo volledig mogelijk. Noem relevante websites, merken en bedrijven als je ze kent." },
          { role: "user", content: question },
        ],
        max_tokens: 1000,
      }),
    });

    if (!questionResponse.ok) {
      const status = questionResponse.status;
      const body = await questionResponse.text();
      if (status === 429) return { response: "Rate limit bereikt", isMentioned: false, mentionPosition: null, sentiment: "neutral" };
      if (status === 402) return { response: "Credits op", isMentioned: false, mentionPosition: null, sentiment: "neutral" };
      console.error(`Model ${modelId} error: ${status} ${body}`);
      return { response: `Fout: ${status}`, isMentioned: false, mentionPosition: null, sentiment: "neutral" };
    }

    const questionData = await questionResponse.json();
    const aiResponse = questionData.choices?.[0]?.message?.content || "";

    const analysisResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: `Analyseer het AI-antwoord en bepaal of het domein "${domain}" (of de merknaam/bedrijfsnaam die bij dit domein hoort) wordt genoemd.` },
          { role: "user", content: `Domein: ${domain}\n\nAI Antwoord:\n${aiResponse}` },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_mention",
              description: "Analyze if the domain/brand is mentioned",
              parameters: {
                type: "object",
                properties: {
                  is_mentioned: { type: "boolean" },
                  mention_position: { type: "integer" },
                  sentiment: { type: "string", enum: ["positive", "neutral", "negative"] },
                },
                required: ["is_mentioned", "mention_position", "sentiment"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "analyze_mention" } },
      }),
    });

    if (!analysisResponse.ok) {
      const domainBase = domain.replace(/^www\./, "").split(".")[0].toLowerCase();
      const responseLower = aiResponse.toLowerCase();
      const isMentioned = responseLower.includes(domain.toLowerCase()) || responseLower.includes(domainBase);
      return { response: aiResponse, isMentioned, mentionPosition: isMentioned ? 1 : null, sentiment: "neutral" };
    }

    const analysisData = await analysisResponse.json();
    const toolCall = analysisData.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      const args = JSON.parse(toolCall.function.arguments);
      return {
        response: aiResponse,
        isMentioned: args.is_mentioned ?? false,
        mentionPosition: args.is_mentioned ? (args.mention_position ?? null) : null,
        sentiment: args.sentiment ?? "neutral",
      };
    }

    const domainBase = domain.replace(/^www\./, "").split(".")[0].toLowerCase();
    const responseLower = aiResponse.toLowerCase();
    const isMentioned = responseLower.includes(domain.toLowerCase()) || responseLower.includes(domainBase);
    return { response: aiResponse, isMentioned, mentionPosition: isMentioned ? 1 : null, sentiment: "neutral" };
  } catch (error) {
    console.error(`Error with model ${modelId}:`, error);
    return { response: "Fout bij ophalen", isMentioned: false, mentionPosition: null, sentiment: "neutral" };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    const supabase = createClient(supabaseUrl, supabaseKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Niet geautoriseerd" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (!profile || profile.plan !== "enterprise") {
      return new Response(JSON.stringify({ error: "Enterprise plan vereist" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { questions, domain, pageId }: RankingRequest = await req.json();
    if (!questions?.length || !domain || !pageId) {
      return new Response(JSON.stringify({ error: "Vragen, domein en pagina ID zijn vereist" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const limitedQuestions = questions.slice(0, 5);
    const totalCredits = limitedQuestions.length * CREDITS_PER_QUESTION;

    // Credit check
    const creditCheck = await checkCredits(supabase, user.id, totalCredits);
    if (!creditCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'credits_exhausted',
        message: `Onvoldoende credits. Deze check kost ${totalCredits} credits, je hebt er nog ${creditCheck.remaining}.`,
        credits: creditCheck
      }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: check, error: checkError } = await supabase
      .from("ai_ranking_checks")
      .insert({ user_id: user.id, page_id: pageId, domain })
      .select("id")
      .single();
    if (checkError) throw checkError;

    const results: any[] = [];
    for (const question of limitedQuestions) {
      const modelPromises = MODELS.map(async (model) => {
        const result = await askModel(LOVABLE_API_KEY, model.id, question, domain);
        return {
          check_id: check.id,
          question,
          model: model.id,
          ai_response: result.response,
          is_mentioned: result.isMentioned,
          mention_position: result.mentionPosition,
          sentiment: result.sentiment,
        };
      });
      const questionResults = await Promise.all(modelPromises);
      results.push(...questionResults);
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    const { error: insertError } = await supabase.from("ai_ranking_results").insert(results);
    if (insertError) console.error("Insert error:", insertError);

    await supabase.from("ai_ranking_checks").update({ status: "completed" }).eq("id", check.id);

    // Log credit usage after successful completion
    await logCreditUsage(supabase, user.id, 'ai_ranking_check', totalCredits);

    return new Response(JSON.stringify({ checkId: check.id, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-ai-ranking error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Onbekende fout" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
