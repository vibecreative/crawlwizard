import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const MAX_CONTENT_SIZE = 1_000_000;
const MAX_TEXT_LENGTH = 1000;
const CREDITS_REQUIRED = 1;

async function checkCredits(supabase: any, userId: string, creditsNeeded: number) {
  const { data, error } = await supabase.rpc('get_remaining_credits', { _user_id: userId });
  if (error) throw new Error('Could not check credits');
  const credits = typeof data === 'string' ? JSON.parse(data) : data;
  if (credits.remaining < creditsNeeded) return { allowed: false, ...credits };
  return { allowed: true, ...credits };
}

function getAdminClient() {
  return createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );
}

async function logCreditUsage(userId: string, actionType: string, credits: number) {
  const adminClient = getAdminClient();
  await adminClient.from('ai_credit_usage').insert({ user_id: userId, action_type: actionType, credits_used: credits });
}

function getSystemPrompt(lang: string, analysisExplanation: string, brandContext?: string) {
  if (lang === 'en') {
    return `You are an SEO and AI search behavior expert who optimizes FAQ questions for high relevance in AI responses.

IMPORTANT CONTEXT:
A previously generated question scored LOW on AI Search Readiness. The reason was:
"${analysisExplanation.substring(0, 500)}"

Your task: Generate 1 BETTER question that DOES score high, by:
1. Making the question more general about the product category
2. Focusing on topics where this page DOES have strong information
3. Addressing a search intent where the page content directly provides an answer

CRITICAL RULES:
- Question: General about the main topic/product category (8-15 words)
- Answer: Based on concrete page content (75-150 words)
- Avoid questions about details that are NOT on the page
${brandContext ? `\nBRAND CONTEXT - Adapt the answer to this brand identity:\n${brandContext}\n\nUse the tone of voice and terminology of this brand.` : ''}

Generate 1 FAQ item. Write in English.`;
  }

  return `Je bent een SEO en AI-zoekgedrag expert die FAQ-vragen optimaliseert voor hoge relevantie in AI-antwoorden.

BELANGRIJKE CONTEXT:
Een eerder gegenereerde vraag scoorde LAAG op AI Search Readiness. De reden was:
"${analysisExplanation.substring(0, 500)}"

Jouw taak: Genereer 1 BETERE vraag die WEL hoog scoort, door:
1. De vraag algemener te maken over de productcategorie
2. Te focussen op onderwerpen waar deze pagina WEL sterke informatie over biedt
3. Een zoekintentie te adresseren waar de pagina-content direct antwoord op geeft

KRITISCHE REGELS:
- Vraag: Algemeen over het hoofdonderwerp/productcategorie (8-15 woorden)
- Antwoord: Gebaseerd op concrete pagina-content (75-150 woorden)
- Vermijd vragen over details die NIET op de pagina staan
${brandContext ? `\nBRAND CONTEXT - Pas het antwoord aan op deze merkidentiteit:\n${brandContext}\n\nGebruik de tone of voice en terminologie van dit merk.` : ''}

Genereer 1 FAQ item. Schrijf in het Nederlands.`;
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

    const creditCheck = await checkCredits(supabaseClient, user.id, CREDITS_REQUIRED);
    if (!creditCheck.allowed) {
      return new Response(JSON.stringify({ 
        error: 'credits_exhausted',
        message: `No AI credits remaining this month. ${creditCheck.used}/${creditCheck.limit} used.`,
        credits: creditCheck
      }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { html, previousQuestion, analysisExplanation, brandContext, language } = body;
    const lang = language === 'en' ? 'en' : 'nl';
    
    if (!html || typeof html !== 'string') {
      return new Response(JSON.stringify({ error: 'HTML content is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!previousQuestion || typeof previousQuestion !== 'string' || previousQuestion.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: 'previousQuestion invalid' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    if (!analysisExplanation || typeof analysisExplanation !== 'string' || analysisExplanation.length > MAX_TEXT_LENGTH) {
      return new Response(JSON.stringify({ error: 'analysisExplanation invalid' }),
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

    const userContent = lang === 'en'
      ? `Previously generated question with low score: "${previousQuestion.substring(0, 500)}"\n\nReason for low score: ${analysisExplanation.substring(0, 500)}\n\nGenerate 1 better question:\n\n${limitedContent}`
      : `Eerder gegenereerde vraag met lage score: "${previousQuestion.substring(0, 500)}"\n\nReden van lage score: ${analysisExplanation.substring(0, 500)}\n\nGenereer 1 betere vraag:\n\n${limitedContent}`;

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: getSystemPrompt(lang, analysisExplanation, brandContext) },
          { role: 'user', content: userContent }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "generate_improved_faq",
              description: "Generate 1 improved FAQ",
              parameters: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  answer: { type: "string" }
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
      if (response.status === 429) return new Response(JSON.stringify({ error: 'Rate limit reached.' }), { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      if (response.status === 402) return new Response(JSON.stringify({ error: 'Credits exhausted.' }), { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      throw new Error('AI gateway error');
    }

    await logCreditUsage(supabaseClient, user.id, 'faq_regeneration', CREDITS_REQUIRED);

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) throw new Error('No tool call received from AI');
    const improvedFaq = JSON.parse(toolCall.function.arguments);

    return new Response(JSON.stringify(improvedFaq), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in regenerate-faq function:', error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
