import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!jwt) {
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
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check ENTERPRISE plan
    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single();

    if (!profile || profile.plan !== 'enterprise') {
      return new Response(JSON.stringify({ error: 'Deze functie is alleen beschikbaar voor Enterprise abonnees.' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { question, answer, pageContent, mode } = body;

    if (!question || !answer) {
      return new Response(JSON.stringify({ error: 'Vraag en antwoord zijn vereist' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Extract text from page content for context
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
- Varieer zinslengte drastisch: mix korte krachtige zinnen met langere, complexere zinnen
- Gebruik af en toe spreektaal, tussenwerpsels of retorische vragen
- Voeg persoonlijke meningen, ervaringen of anekdotes toe waar passend
- Gebruik onregelmatige alinealengtes
- Vermijd perfecte opsommingen - maak ze soms onvolledig of in lopende tekst
- Gebruik af en toe een onverwachte woordkeuze of metafoor
- Begin niet elke alinea met het onderwerp - varieer de openingszinnen
- Laat af en toe een kleine imperfectie staan (niet grammaticaal, maar stilistisch)
- Schrijf alsof je een expert bent die informeel met een collega praat
- Behoud ALLE inhoudelijke informatie en de heading-structuur

Output: De volledige herschreven tekst in Markdown-formaat met dezelfde structuur.`
      : `Je bent een ervaren Nederlandse contentschrijver en SEO-expert die diepgaande, waardevolle artikelen schrijft.

DOEL: Schrijf een uitgebreid artikel (1200-1800 woorden) dat de FAQ-vraag als uitgangspunt neemt en uitbreidt tot een compleet, informatief artikel.

STRUCTUUR-EISEN:
- Begin met een H1 die de kernvraag van de lezer beantwoordt (niet de letterlijke FAQ-vraag)
- Gebruik 4-6 H2 subkoppen die logisch het onderwerp opdelen
- Gebruik waar nodig H3 subkoppen voor verdere detaillering
- Elke sectie moet 150-300 woorden bevatten
- Sluit af met een praktische conclusie/samenvatting

SCHRIJFSTIJL - CRUCIAAL:
- Schrijf alsof je een ervaren vakman/expert bent die informeel maar kundig vertelt
- Varieer zinslengte: mix korte krachtige zinnen met langere uitleg
- Gebruik af en toe een retorische vraag of direct de lezer aanspreken
- Vermijd perfecte, voorspelbare structuren - wees menselijk
- Gebruik concrete voorbeelden, cijfers en praktijksituaties
- Geen generieke filler-tekst: elke zin moet waarde toevoegen
- Schrijf op B1-B2 niveau, conversational maar professioneel
- Gebruik GEEN woorden als "cruciaal", "essentieel", "in de huidige tijd" of andere typische AI-markers
- Begin alinea's NIET steeds met hetzelfde patroon

SEO-OPTIMALISATIE:
- Verwerk het hoofdonderwerp natuurlijk in H1, eerste alinea, en H2's
- Gebruik LSI-keywords (gerelateerde termen) door de tekst
- Schrijf voor featured snippets: beantwoord vragen direct in de eerste 2-3 zinnen van relevante secties
- Voeg interne linking suggesties toe als [link: onderwerp] markers

OUTPUT: Markdown-formaat met juiste heading-hiërarchie (# H1, ## H2, ### H3).`;

    const userPrompt = isRewrite
      ? `Herschrijf de volgende tekst zodat deze menselijker klinkt en niet als AI-gegenereerd wordt herkend. Behoud de volledige inhoud en structuur:\n\n${body.articleText}`
      : `FAQ Vraag: ${question}
FAQ Antwoord: ${answer}

${contextText ? `Context van de bronpagina:\n${contextText}` : ''}

Schrijf een uitgebreid artikel (1200-1800 woorden) gebaseerd op deze FAQ. Het artikel moet veel dieper gaan dan het FAQ-antwoord en echte waarde bieden aan de lezer.`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'openai/gpt-5-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit bereikt, probeer het later opnieuw.' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Credits opgebruikt. Voeg credits toe aan je workspace.' }), {
          status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    const data = await response.json();
    const article = data.choices?.[0]?.message?.content;

    if (!article) {
      throw new Error('Geen artikel ontvangen van AI');
    }

    // Now check AI detection score
    const detectionResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
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
            content: `Je bent een AI-detectie expert. Analyseer de gegeven tekst en bepaal hoe waarschijnlijk het is dat deze door een mens is geschreven.

Beoordeel op basis van:
1. Zinsvariatie (lengte, structuur, complexiteit)
2. Natuurlijk taalgebruik (spreektaal, idioom, onregelmatigheden)
3. Persoonlijke stem (meningen, ervaringen, unieke perspectieven)
4. Onvoorspelbaarheid (verrassende woordkeuzes, onverwachte wendingen)
5. Structuurvariatie (niet-perfecte opsommingen, wisselende alinealengtes)`
          },
          {
            role: 'user',
            content: `Analyseer deze tekst op menselijkheid:\n\n${article.substring(0, 5000)}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "ai_detection_result",
              description: "Geef het AI-detectie resultaat",
              parameters: {
                type: "object",
                properties: {
                  human_score: {
                    type: "number",
                    description: "Score van 0-100. 0 = zeker AI, 100 = zeker mens"
                  },
                  verdict: {
                    type: "string",
                    enum: ["menselijk", "waarschijnlijk_menselijk", "onzeker", "waarschijnlijk_ai", "ai_gegenereerd"]
                  },
                  improvements: {
                    type: "array",
                    items: { type: "string" },
                    description: "3-5 concrete suggesties om de tekst menselijker te maken"
                  },
                  explanation: {
                    type: "string",
                    description: "Korte uitleg van de beoordeling in 2-3 zinnen"
                  }
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
      if (toolCall) {
        detection = JSON.parse(toolCall.function.arguments);
      }
    }

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
