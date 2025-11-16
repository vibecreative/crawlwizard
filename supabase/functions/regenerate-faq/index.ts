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
    const { html, previousQuestion, analysisExplanation } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Simple text extraction
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    
    const limitedContent = textContent.substring(0, 10000);

    console.log('Regenerating FAQ for content length:', limitedContent.length);
    console.log('Previous question had low score:', previousQuestion);

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
            content: `Je bent een SEO en AI-zoekgedrag expert die FAQ-vragen optimaliseert voor hoge relevantie in AI-antwoorden.

BELANGRIJKE CONTEXT:
Een eerder gegenereerde vraag scoorde LAAG op AI Search Readiness. De reden was:
"${analysisExplanation}"

Jouw taak: Genereer 1 BETERE vraag die WEL hoog scoort, door:
1. De vraag algemener te maken over de productcategorie (niet specifiek over deze pagina)
2. Te focussen op onderwerpen waar deze pagina WEL sterke, concrete informatie over biedt
3. Een zoekintentie te adresseren waar de pagina-content direct antwoord op geeft

KRITISCHE REGELS:
- Vraag: Algemeen over het hoofdonderwerp/productcategorie (8-15 woorden)
- Antwoord: Gebaseerd op concrete pagina-content (75-150 woorden)
- De vraag moet zo zijn dat de pagina-content een STERK, COMPLEET antwoord kan geven
- Vermijd vragen over details die NIET op de pagina staan

Voorbeeld transformatie:
❌ Slechte vraag (laag scorend): "Wat zijn de gemiddelde kosten van X?" (als pagina geen prijzen noemt)
✅ Goede vraag (hoog scorend): "Welke factoren bepalen de prijs van X?" (als pagina wel factoren noemt)

Genereer 1 FAQ item. Schrijf in het Nederlands.`
          },
          {
            role: 'user',
            content: `Eerder gegenereerde vraag met lage score: "${previousQuestion}"

Reden van lage score: ${analysisExplanation}

Analyseer deze pagina en genereer 1 betere, meer relevante vraag waar de pagina-content een sterk antwoord op kan geven:

${limitedContent}`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_improved_faq",
              description: "Genereer 1 verbeterde FAQ met hogere relevantie",
              parameters: {
                type: "object",
                properties: {
                  question: { 
                    type: "string",
                    description: "Verbeterde vraag die beter aansluit bij pagina-content"
                  },
                  answer: { 
                    type: "string",
                    description: "Antwoord gebaseerd op concrete pagina-content"
                  }
                },
                required: ["question", "answer"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "generate_improved_faq" } }
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

    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      throw new Error('Geen tool call ontvangen van AI');
    }

    const improvedFaq = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(improvedFaq), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in regenerate-faq function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
