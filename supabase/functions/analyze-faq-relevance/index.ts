import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_CONTENT_SIZE = 1_000_000;
const MAX_QUESTION_LENGTH = 500;
const MAX_URL_LENGTH = 2048;
const CREDITS_REQUIRED = 1;

function validateUrl(url: string): boolean {
  const urlRegex = /^https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(:[0-9]+)?(\/.*)?$/;
  return urlRegex.test(url);
}

async function checkCredits(supabase: any, userId: string, creditsNeeded: number) {
  const { data, error } = await supabase.rpc('get_remaining_credits', { _user_id: userId });
  if (error) throw new Error('Kon credits niet controleren');
  const credits = typeof data === 'string' ? JSON.parse(data) : data;
  if (credits.remaining < creditsNeeded) {
    return { allowed: false, ...credits };
  }
  return { allowed: true, ...credits };
}

async function logCreditUsage(supabase: any, userId: string, actionType: string, credits: number) {
  await supabase.from('ai_credit_usage').insert({
    user_id: userId,
    action_type: actionType,
    credits_used: credits,
  });
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
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Credit check
    const creditCheck = await checkCredits(supabaseClient, user.id, CREDITS_REQUIRED);
    if (!creditCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'credits_exhausted',
        message: `Je hebt geen AI-credits meer over deze maand. ${creditCheck.used}/${creditCheck.limit} gebruikt.`,
        credits: creditCheck
      }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { question, websiteUrl, pageContent } = body;
    
    if (!question || typeof question !== 'string') {
      return new Response(JSON.stringify({ error: 'question must be a non-empty string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (question.length > MAX_QUESTION_LENGTH) {
      return new Response(JSON.stringify({ error: `question too long. Maximum ${MAX_QUESTION_LENGTH} characters.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return new Response(JSON.stringify({ error: 'websiteUrl must be a non-empty string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (websiteUrl.length > MAX_URL_LENGTH) {
      return new Response(JSON.stringify({ error: `websiteUrl too long. Maximum ${MAX_URL_LENGTH} characters.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!validateUrl(websiteUrl)) {
      return new Response(JSON.stringify({ error: 'Invalid websiteUrl format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    let pageContentToProcess = '';
    if (pageContent && typeof pageContent === 'string') {
      pageContentToProcess = pageContent.length > MAX_CONTENT_SIZE 
        ? pageContent.slice(0, MAX_CONTENT_SIZE) : pageContent;
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) throw new Error('LOVABLE_API_KEY is not configured');

    const limitedContent = pageContentToProcess ? pageContentToProcess.substring(0, 5000) : 'Geen content beschikbaar';

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `Je bent een AI Search Readiness expert die analyseert hoe goed een FAQ-vraag aansluit bij de content van een specifieke webpagina.

BELANGRIJK CONTEXT:
De FAQ-vragen zijn BEWUST algemeen geformuleerd als oriëntatievragen die mensen aan AI-assistenten stellen VOORDAT ze een specifieke leverancier bezoeken. Het zijn GEEN product-specifieke vragen. De vragen gaan over het HOOFDONDERWERP/de PRODUCTCATEGORIE van de pagina.

Jouw taak:
Beoordeel of de webpagina voldoende relevante informatie bevat om een goed antwoord te geven op deze algemene oriëntatievraag. Kijk naar:
1. Past het ONDERWERP van de vraag bij het hoofdonderwerp van de pagina? (belangrijkste factor)
2. Bevat de pagina informatie die kan helpen bij het beantwoorden van de vraag?
3. Zou een AI-assistent deze pagina als relevante bron kunnen gebruiken?

Scoringsrichtlijn:
- 80-100: Het onderwerp van de vraag sluit direct aan bij de pagina-content. De pagina bevat relevante informatie.
- 50-79: Het onderwerp is gerelateerd maar de pagina gaat over een specifiek sub-aspect, of de vraag is breder dan de pagina-scope.
- 0-49: Het onderwerp van de vraag heeft weinig tot geen overlap met de pagina-content.

KRITISCH: Een algemene vraag over hetzelfde onderwerp als de pagina verdient ALTIJD een score van minimaal 60, ook als de pagina niet letterlijk elk detail van het antwoord bevat.

Leg kort uit waarom je deze score geeft (max 50 woorden, in het Nederlands).`
          },
          {
            role: 'user',
            content: `FAQ-vraag: "${question}"

Website URL: ${websiteUrl}

Pagina-content (samenvatting):
${limitedContent}

Beoordeel hoe goed deze pagina als bron kan dienen voor een AI-antwoord op bovenstaande vraag.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "analyze_relevance",
              description: "Analyseer de relevantie van de website voor deze vraag",
              parameters: {
                type: "object",
                properties: {
                  score: { type: "number", minimum: 0, maximum: 100, description: "Relevantiescore 0-100" },
                  explanation: { type: "string", description: "Korte uitleg van de score (max 50 woorden)" },
                  category: { type: "string", enum: ["high", "medium", "low"], description: "Relevantiecategorie" }
                },
                required: ["score", "explanation", "category"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "analyze_relevance" } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit bereikt, probeer het later opnieuw.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits opgebruikt. Voeg credits toe aan je workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    // Log credit usage after successful AI call
    await logCreditUsage(supabaseClient, user.id, 'faq_analysis', CREDITS_REQUIRED);

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('Geen tool call ontvangen van AI');

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-faq-relevance function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
