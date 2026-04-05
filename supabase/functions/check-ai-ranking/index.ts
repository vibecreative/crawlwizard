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

const CREDITS_PER_QUESTION = 4;

interface RankingRequest {
  questions: string[];
  domain: string;
  pageId: string;
  language?: string;
}

async function checkCredits(supabase: any, userId: string, creditsNeeded: number) {
  const { data, error } = await supabase.rpc('get_remaining_credits', { _user_id: userId });
  if (error) throw new Error('Could not check credits');
  const credits = typeof data === 'string' ? JSON.parse(data) : data;
  if (credits.remaining < creditsNeeded) return { allowed: false, ...credits };
  return { allowed: true, ...credits };
}

function getAdminClient() {
  return createClient(
    Deno.env.get("SUPABASE_URL") ?? '',
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ''
  );
}

async function logCreditUsage(userId: string, actionType: string, credits: number) {
  const adminClient = getAdminClient();
  await adminClient.from('ai_credit_usage').insert({ user_id: userId, action_type: actionType, credits_used: credits });
}

async function askModel(
  apiKey: string,
  modelId: string,
  question: string,
  domain: string,
  lang: string
) {
  try {
    const systemContent = lang === 'en'
      ? "You are a helpful AI assistant. Answer the question as completely as possible. Mention relevant websites, brands and companies if you know them."
      : "Je bent een behulpzame AI-assistent. Beantwoord de vraag zo volledig mogelijk. Noem relevante websites, merken en bedrijven als je ze kent.";

    const questionResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: "system", content: systemContent },
          { role: "user", content: question },
        ],
        max_tokens: 1000,
      }),
    });

    if (!questionResponse.ok) {
      const status = questionResponse.status;
      const body = await questionResponse.text();
      if (status === 429) return { response: "Rate limit reached", isMentioned: false, mentionPosition: null, sentiment: "neutral" };
      if (status === 402) return { response: "Credits exhausted", isMentioned: false, mentionPosition: null, sentiment: "neutral" };
      console.error(`Model ${modelId} error: ${status} ${body}`);
      return { response: `Error: ${status}`, isMentioned: false, mentionPosition: null, sentiment: "neutral" };
    }

    const questionData = await questionResponse.json();
    const aiResponse = questionData.choices?.[0]?.message?.content || "";

    const analysisSystemContent = lang === 'en'
      ? `Analyze the AI response and determine if the domain "${domain}" (or the brand/company name associated with this domain) is mentioned.`
      : `Analyseer het AI-antwoord en bepaal of het domein "${domain}" (of de merknaam/bedrijfsnaam die bij dit domein hoort) wordt genoemd.`;

    const analysisResponse = await fetch(AI_GATEWAY_URL, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: analysisSystemContent },
          { role: "user", content: `${lang === 'en' ? 'Domain' : 'Domein'}: ${domain}\n\nAI ${lang === 'en' ? 'Response' : 'Antwoord'}:\n${aiResponse}` },
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
    return { response: "Error fetching", isMentioned: false, mentionPosition: null, sentiment: "neutral" };
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
      return new Response(JSON.stringify({ error: "Not authorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single();
    if (!profile || profile.plan !== "enterprise") {
      return new Response(JSON.stringify({ error: "Enterprise plan required" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { questions, domain, pageId, language }: RankingRequest = await req.json();
    const lang = language === 'en' ? 'en' : 'nl';

    if (!questions?.length || !domain || !pageId) {
      return new Response(JSON.stringify({ error: "Questions, domain and page ID are required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const limitedQuestions = questions.slice(0, 5);
    const totalCredits = limitedQuestions.length * CREDITS_PER_QUESTION;

    const creditCheck = await checkCredits(supabase, user.id, totalCredits);
    if (!creditCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'credits_exhausted',
        message: `Insufficient credits. This check costs ${totalCredits} credits, you have ${creditCheck.remaining} remaining.`,
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
        const result = await askModel(LOVABLE_API_KEY, model.id, question, domain, lang);
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

    await logCreditUsage(supabase, user.id, 'ai_ranking_check', totalCredits);

    return new Response(JSON.stringify({ checkId: check.id, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("check-ai-ranking error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
