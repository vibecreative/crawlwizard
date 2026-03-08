import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_CONTENT_SIZE = 1_000_000;
const CREDITS_REQUIRED = 1;

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
    const { html, brandContext } = body;
    if (!html || typeof html !== 'string') {
      return new Response(JSON.stringify({ error: 'HTML content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let htmlToProcess = html.length > MAX_CONTENT_SIZE ? html.slice(0, MAX_CONTENT_SIZE) : html;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const textContent = htmlToProcess
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const limitedContent = textContent.substring(0, 10000);

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          {
            role: 'system',
            content: `Je bent een SEO en AI-zoekgedrag expert die FAQ-schema's maakt geoptimaliseerd voor LLM's en featured snippets.

KRITISCH BELANGRIJK - HET ZOEKPROCES:
Je genereert FAQ's die mensen aan AI-assistenten (ChatGPT, Gemini, Perplexity) stellen TIJDENS hun oriëntatiefase, VOORDAT ze een specifieke leverancier of pagina bezoeken. Het zijn vragen van iemand die:
- Nog geen specifieke oplossing of product heeft gekozen
- Aan het onderzoeken is wat de beste optie is
- Verschillende alternatieven aan het overwegen is
- Twijfelt tussen verschillende oplossingen
- Zich afvraagt of dit überhaupt de juiste oplossing is

VERBODEN: Vragen over specifieke producten, merken, modellen of features die alleen op deze pagina staan. De vragen moeten ALGEMEEN zijn over het hoofdonderwerp/de productcategorie.

PERSPECTIEF - WAT VRAAGT DE ZOEKER:
- "Is dit de juiste oplossing voor mijn probleem?"
- "Wat zijn de alternatieven en wanneer kies ik waarvoor?"
- "Welke veelvoorkomende fouten moet ik vermijden?"
- "Waar moet ik op letten bij het kiezen?"
- "Wat zijn de voor- en nadelen van verschillende opties?"

ANTWOORDEN - GEBRUIK PAGINA-CONTENT:
Beantwoord de algemene vragen met concrete informatie uit de geanalyseerde pagina waar mogelijk.

EISEN:
- Vragen: Natuurlijke conversational taal, 8-15 woorden, mix van wat/hoe/waarom/welke/wanneer
- Antwoorden: 75-150 woorden met concrete, praktische informatie
- Diversiteit: 3x basisinformatie, 2x vergelijkingen, 2x praktische toepassing, 2x problemen/zorgen, 1x kosten/waarde
- Taal: B1-niveau, conversational, natuurlijk
- CRITICAL: Antwoorden MOETEN beginnen met de eerste woorden van het eigenlijke antwoord. GEEN labels.

Genereer 10 FAQ items. Schrijf in het Nederlands.`
          },
          {
            role: 'user',
            content: `Analyseer deze pagina en genereer 10 FAQ items:\n\n${limitedContent}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_faqs",
              description: "Genereer 10 FAQ items",
              parameters: {
                type: "object",
                properties: {
                  faqs: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        question: { type: "string" },
                        answer: { type: "string" }
                      },
                      required: ["question", "answer"],
                      additionalProperties: false
                    },
                    minItems: 10,
                    maxItems: 10
                  }
                },
                required: ["faqs"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_faqs" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit bereikt, probeer het later opnieuw.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Credits opgebruikt.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    await logCreditUsage(supabaseClient, user.id, 'faq_generation', CREDITS_REQUIRED);

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('Geen tool call ontvangen van AI');
    const faqs = JSON.parse(toolCall.function.arguments).faqs;

    return new Response(JSON.stringify({ faqs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-faqs function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
