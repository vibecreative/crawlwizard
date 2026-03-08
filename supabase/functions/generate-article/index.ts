import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const CREDITS_REQUIRED = 2; // article generation + detection

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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();
    if (!jwt) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: profile } = await supabaseClient.from('profiles').select('plan').eq('id', user.id).single();
    if (!profile || profile.plan !== 'enterprise') {
      return new Response(JSON.stringify({ error: 'Enterprise plan vereist' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Credit check
    const creditCheck = await checkCredits(supabaseClient, user.id, CREDITS_REQUIRED);
    if (!creditCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'credits_exhausted',
        message: `Je hebt geen AI-credits meer over deze maand. ${creditCheck.used}/${creditCheck.limit} gebruikt.`,
        credits: creditCheck
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { question, answer, pageContent, mode } = body;

    if (!question || !answer) {
      return new Response(JSON.stringify({ error: 'Vraag en antwoord zijn vereist' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    let contextText = '';
    if (pageContent) {
      contextText = pageContent
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 8000);
    }

    const isRewrite = mode === 'rewrite';

    const systemPrompt = isRewrite
      ? `Je bent een ervaren Nederlandse contentschrijver en SEO-expert. Je herschrijft teksten zodat ze NIET herkend worden als AI-gegenereerd.

HERSCHRIJF-REGELS:
- Varieer zinslengte drastisch
- Gebruik af en toe spreektaal, tussenwerpsels of retorische vragen
- Voeg persoonlijke meningen toe waar passend
- Gebruik onregelmatige alinealengtes
- Schrijf alsof je een expert bent die informeel met een collega praat
- Behoud ALLE inhoudelijke informatie en de heading-structuur

Output: De volledige herschreven tekst in Markdown-formaat.`
      : `Je bent een ervaren Nederlandse contentschrijver en SEO-expert.

DOEL: Schrijf een uitgebreid artikel (1200-1800 woorden) dat de FAQ-vraag uitbreidt tot een compleet artikel.

STRUCTUUR: H1 + 4-6 H2's + waar nodig H3's. Elke sectie 150-300 woorden.

SCHRIJFSTIJL: Menselijk, gevarieerd, concreet. Geen AI-markers. B1-B2 niveau.

SEO: Hoofdonderwerp in H1/eerste alinea/H2's. LSI-keywords. Featured snippet optimalisatie.

OUTPUT: Markdown-formaat.`;

    const userPrompt = isRewrite
      ? `Herschrijf:\n\n${body.articleText}`
      : `FAQ Vraag: ${question}\nFAQ Antwoord: ${answer}\n\n${contextText ? `Context:\n${contextText}` : ''}\n\nSchrijf een uitgebreid artikel (1200-1800 woorden).`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit bereikt.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Credits opgebruikt.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const article = data.choices?.[0]?.message?.content;
    if (!article) throw new Error('Geen artikel ontvangen van AI');

    const detectionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${LOVABLE_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: `Je bent een AI-detectie expert. Analyseer hoe waarschijnlijk de tekst door een mens is geschreven.` },
          { role: 'user', content: `Analyseer:\n\n${article.substring(0, 5000)}` }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "ai_detection_result",
              description: "AI-detectie resultaat",
              parameters: {
                type: "object",
                properties: {
                  human_score: { type: "number", description: "0-100. 0=AI, 100=mens" },
                  verdict: { type: "string", enum: ["menselijk", "waarschijnlijk_menselijk", "onzeker", "waarschijnlijk_ai", "ai_gegenereerd"] },
                  improvements: { type: "array", items: { type: "string" }, description: "3-5 suggesties" },
                  explanation: { type: "string", description: "Korte uitleg" }
                },
                required: ["human_score", "verdict", "improvements", "explanation"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "ai_detection_result" } }
      }),
    });

    let detection = null;
    if (detectionResponse.ok) {
      const detectionData = await detectionResponse.json();
      const toolCall = detectionData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall) detection = JSON.parse(toolCall.function.arguments);
    }

    // Log credit usage after successful completion
    await logCreditUsage(supabaseClient, user.id, 'article_generation', CREDITS_REQUIRED);

    return new Response(JSON.stringify({ article, detection }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-article:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
