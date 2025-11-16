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
    const { question, websiteUrl, pageContent } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing FAQ relevance for question:', question);

    // Limit page content to avoid token limits
    const limitedContent = pageContent.substring(0, 5000);

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
            content: `Je bent een AI Search Readiness expert die analyseert hoe goed een website zou scoren in AI-assistenten zoals ChatGPT en Gemini.

Je krijgt:
1. Een vraag die gebruikers aan AI-assistenten zouden kunnen stellen
2. De URL en content van een website

Jouw taak:
Beoordeel hoe relevant deze website/producten/diensten zouden zijn in een AI-antwoord op deze vraag.

Geef een score van 0-100:
- 80-100: Hoog relevant - Website zou waarschijnlijk direct genoemd worden in eerste dialoog
- 50-79: Gemiddeld relevant - Website zou mogelijk genoemd worden, maar niet als top-optie
- 0-49: Laag relevant - Website zou waarschijnlijk niet genoemd worden

Leg kort uit waarom je deze score geeft (max 50 woorden).`
          },
          {
            role: 'user',
            content: `Vraag: "${question}"

Website URL: ${websiteUrl}

Website content:
${limitedContent}

Analyseer de relevantie en geef een score.`
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
                  score: {
                    type: "number",
                    minimum: 0,
                    maximum: 100,
                    description: "Relevantiescore 0-100"
                  },
                  explanation: {
                    type: "string",
                    description: "Korte uitleg van de score (max 50 woorden)"
                  },
                  category: {
                    type: "string",
                    enum: ["high", "medium", "low"],
                    description: "Relevantiecategorie"
                  }
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

    const analysis = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in analyze-faq-relevance function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
