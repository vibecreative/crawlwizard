import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum HTML size we'll process (we truncate beyond this to keep requests stable)
const MAX_CONTENT_SIZE = 1_000_000; // 1MB

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!jwt) {
      console.warn('Missing Authorization header');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(jwt);
    if (authError || !user) {
      console.warn('Auth failed:', authError?.message ?? 'no_user');
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Authenticated user:', user.id);

    const body = await req.json();
    const { html } = body;
    
    // Input validation
    if (!html) {
      return new Response(
        JSON.stringify({ error: 'HTML content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (typeof html !== 'string') {
      return new Response(
        JSON.stringify({ error: 'HTML must be a string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let htmlToProcess = html;
    if (htmlToProcess.length > MAX_CONTENT_SIZE) {
      console.warn(
        `HTML too large (${htmlToProcess.length} chars). Truncating to ${MAX_CONTENT_SIZE}.`
      );
      htmlToProcess = htmlToProcess.slice(0, MAX_CONTENT_SIZE);
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Simple text extraction - remove HTML tags and limit length
    const textContent = htmlToProcess
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit content to avoid token limits
    const limitedContent = textContent.substring(0, 10000);

    console.log('Generating FAQs for content length:', limitedContent.length);

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

VOORBEELDEN VAN HET VERSCHIL:
❌ FOUT (te specifiek naar pagina): "Wat zijn de voordelen van het DRS-systeem van Meclean?"
✅ GOED (algemeen zoekgedrag): "Wat is het verschil tussen een enkele en dubbele borstel bij veegmachines?"

❌ FOUT: "Welke garantie geeft Meclean op hun veegmachines?"
✅ GOED: "Hoe lang gaat een professionele veegmachine gemiddeld mee?"

❌ FOUT: "Wat kost de BUSTER 800S?"
✅ GOED: "Wat zijn de gemiddelde kosten van een industriële veegmachine?"

PERSPECTIEF - WAT VRAAGT DE ZOEKER:
- "Is dit de juiste oplossing voor mijn probleem?"
- "Wat zijn de alternatieven en wanneer kies ik waarvoor?"
- "Welke veelvoorkomende fouten moet ik vermijden?"
- "Waar moet ik op letten bij het kiezen?"
- "Wat zijn de voor- en nadelen van verschillende opties?"

ANTWOORDEN - GEBRUIK PAGINA-CONTENT:
Beantwoord de algemene vragen met concrete informatie uit de geanalyseerde pagina waar mogelijk. Dus:
- Vragen: Algemeen over het hoofdonderwerp
- Antwoorden: Gebaseerd op de concrete kennis en informatie uit de pagina-content
- Als de pagina relevante informatie bevat, gebruik deze in het antwoord
- Als de pagina geen relevante info bevat, geef dan algemene kennis

EISEN:
- Vragen: Natuurlijke conversational taal zoals mensen aan AI stellen, 8-15 woorden, mix van wat/hoe/waarom/welke/wanneer/is het/kun je
- Antwoorden: 75-150 woorden met concrete, praktische informatie die de zoekintentie beantwoordt (gebruik pagina-content waar mogelijk)
- Diversiteit: 3x basisinformatie, 2x vergelijkingen/alternatieven, 2x praktische toepassing, 2x veelvoorkomende problemen/zorgen, 1x kosten/waarde
- Taal: B1-niveau, conversational, natuurlijk, alsof je met een persoon praat
- Doel: LLM-optimalisatie, AI-zoekopdrachten, featured snippets, directe antwoorden

CRITICAL: Antwoorden MOETEN beginnen met de eerste woorden van het eigenlijke antwoord. GEEN labels, GEEN "Direct antwoord:", GEEN "Kort antwoord:", GEEN "Uitbreiding:". Schrijf één natuurlijke alinea zonder onderverdeling.

Voorbeeld GOED: "Een schrobmachine is ideaal voor grote oppervlakten vanaf ongeveer 200m2. Voor kleinere ruimtes is een dweilsysteem vaak efficiënter en goedkoper..."
Voorbeeld FOUT: "Direct antwoord: Een schrobmachine is ideaal..."

Genereer 10 FAQ items. Schrijf in het Nederlands.`
          },
          {
            role: 'user',
            content: `Analyseer deze pagina en identificeer het hoofdonderwerp. Genereer vervolgens 10 FAQ items die bezoekers aan AI-assistenten zouden kunnen stellen tijdens hun zoektocht naar dit onderwerp:\n\n${limitedContent}`
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
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit bereikt, probeer het later opnieuw.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits opgebruikt. Voeg credits toe aan je workspace.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    console.log('AI Response:', JSON.stringify(data));

    // Extract FAQs from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('Geen tool call ontvangen van AI');
    }

    const faqs = JSON.parse(toolCall.function.arguments).faqs;

    return new Response(JSON.stringify({ faqs }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-faqs function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
