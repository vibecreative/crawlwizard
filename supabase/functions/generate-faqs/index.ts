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
    const { html } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Simple text extraction - remove HTML tags and limit length
    const textContent = html
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
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: 'Je bent een SEO expert die FAQ-schema\'s maakt. Genereer 10 relevante vragen en antwoorden op basis van de pagina content. Antwoord ALLEEN met een JSON array in dit formaat: [{"question": "...", "answer": "..."}]. Geen extra tekst, alleen de JSON array. Schrijf in het Nederlands.'
          },
          {
            role: 'user',
            content: `Genereer 10 relevante FAQ items op basis van deze pagina content:\n\n${limitedContent}`
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
