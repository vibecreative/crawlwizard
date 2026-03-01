import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Maximum content sizes
const MAX_CONTENT_SIZE = 1_000_000; // 1MB
const MAX_QUESTION_LENGTH = 500;
const MAX_URL_LENGTH = 2048;

// Validate URL format
function validateUrl(url: string): boolean {
  const urlRegex = /^https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(:[0-9]+)?(\/.*)?$/;
  return urlRegex.test(url);
}

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
    const { question, websiteUrl, pageContent } = body;
    
    // Input validation for question
    if (!question || typeof question !== 'string') {
      return new Response(
        JSON.stringify({ error: 'question must be a non-empty string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (question.length > MAX_QUESTION_LENGTH) {
      return new Response(
        JSON.stringify({ error: `question too long. Maximum ${MAX_QUESTION_LENGTH} characters.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation for websiteUrl
    if (!websiteUrl || typeof websiteUrl !== 'string') {
      return new Response(
        JSON.stringify({ error: 'websiteUrl must be a non-empty string' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (websiteUrl.length > MAX_URL_LENGTH) {
      return new Response(
        JSON.stringify({ error: `websiteUrl too long. Maximum ${MAX_URL_LENGTH} characters.` }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!validateUrl(websiteUrl)) {
      return new Response(
        JSON.stringify({ error: 'Invalid websiteUrl format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Input validation for pageContent (optional)
    let pageContentToProcess = '';
    if (pageContent && typeof pageContent === 'string') {
      pageContentToProcess = pageContent;
      if (pageContentToProcess.length > MAX_CONTENT_SIZE) {
        console.warn(
          `pageContent too large (${pageContentToProcess.length} chars). Truncating to ${MAX_CONTENT_SIZE}.`
        );
        pageContentToProcess = pageContentToProcess.slice(0, MAX_CONTENT_SIZE);
      }
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Analyzing FAQ relevance for question:', question.substring(0, 100));

    // Limit page content to avoid token limits
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
