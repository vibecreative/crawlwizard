import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SitemapUrl {
  loc: string;
  lastmod?: string;
  priority?: string;
}

// Validate URL format and block internal/private networks (SSRF protection)
function validateUrl(url: string): { valid: boolean; error?: string } {
  // Basic URL format validation
  const urlRegex = /^https?:\/\/[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+(:[0-9]+)?(\/.*)?$/;
  if (!urlRegex.test(url)) {
    return { valid: false, error: 'Invalid URL format' };
  }

  // Block internal/private IPs and localhost (SSRF protection)
  const blockedPatterns = [
    'localhost',
    '127.0.0.1',
    '0.0.0.0',
    '10.',
    '172.16.',
    '172.17.',
    '172.18.',
    '172.19.',
    '172.20.',
    '172.21.',
    '172.22.',
    '172.23.',
    '172.24.',
    '172.25.',
    '172.26.',
    '172.27.',
    '172.28.',
    '172.29.',
    '172.30.',
    '172.31.',
    '192.168.',
    '169.254.',
    '[::1]',
    'fc00:',
    'fe80:',
  ];

  const lowerUrl = url.toLowerCase();
  for (const pattern of blockedPatterns) {
    if (lowerUrl.includes(pattern)) {
      return { valid: false, error: 'Invalid URL: internal addresses not allowed' };
    }
  }


const MAX_REDIRECTS = 5;

async function safeFetch(url: string, options: RequestInit): Promise<Response> {
  let currentUrl = url;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const response = await fetch(currentUrl, { ...options, redirect: 'manual' });
    if (response.status >= 300 && response.status < 400) {
      const location = response.headers.get('location');
      if (!location) throw new Error('Redirect without location header');
      const resolved = new URL(location, currentUrl).toString();
      if (!validateUrl(resolved).valid) {
        throw new Error('Redirect to blocked URL');
      }
      currentUrl = resolved;
      continue;
    }
    return response;
  }
  throw new Error('Too many redirects');
}


Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      return new Response(
        JSON.stringify({ success: false, error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Authenticated user:', user.id);

    const { baseUrl } = await req.json();

    if (!baseUrl) {
      return new Response(
        JSON.stringify({ success: false, error: 'Base URL is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate baseUrl type and length
    if (typeof baseUrl !== 'string' || baseUrl.length > 2048) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid URL: must be a string under 2048 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Parsing sitemap for:', baseUrl);

    // Normalize the base URL
    let normalizedUrl = baseUrl.trim();
    if (!normalizedUrl.startsWith('http://') && !normalizedUrl.startsWith('https://')) {
      normalizedUrl = `https://${normalizedUrl}`;
    }

    // Remove trailing slashes
    normalizedUrl = normalizedUrl.replace(/\/+$/, '');

    // Validate the normalized URL
    const urlValidation = validateUrl(normalizedUrl);
    if (!urlValidation.valid) {
      return new Response(
        JSON.stringify({ success: false, error: urlValidation.error }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Common sitemap locations to try
    const sitemapPaths = [
      '/sitemap.xml',
      '/sitemap_index.xml',
      '/sitemap-index.xml',
      '/sitemap/sitemap.xml',
      '/sitemaps/sitemap.xml',
    ];

    let sitemapContent: string | null = null;
    let successfulPath: string | null = null;

    // Try each sitemap path
    for (const path of sitemapPaths) {
      const sitemapUrl = `${normalizedUrl}${path}`;
      console.log('Trying sitemap URL:', sitemapUrl);
      
      try {
        const response = await safeFetch(sitemapUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
            'Accept': 'application/xml, text/xml, */*',
          },
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          const text = await response.text();
          
          // Check if it looks like XML
          if (text.includes('<?xml') || text.includes('<urlset') || text.includes('<sitemapindex')) {
            sitemapContent = text;
            successfulPath = path;
            console.log('Found sitemap at:', sitemapUrl);
            break;
          }
        }
      } catch (error) {
        console.log(`Failed to fetch ${path}:`, error);
        continue;
      }
    }

    if (!sitemapContent) {
      // Try to check robots.txt for sitemap location
      try {
        const robotsUrl = `${normalizedUrl}/robots.txt`;
        console.log('Checking robots.txt:', robotsUrl);
        
        const robotsResponse = await safeFetch(robotsUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
          },
        });

        if (robotsResponse.ok) {
          const robotsText = await robotsResponse.text();
          const sitemapMatch = robotsText.match(/Sitemap:\s*(.+)/i);
          
          if (sitemapMatch && sitemapMatch[1]) {
            const robotsSitemapUrl = sitemapMatch[1].trim();
            
            // Validate the sitemap URL from robots.txt
            const robotsUrlValidation = validateUrl(robotsSitemapUrl);
            if (robotsUrlValidation.valid) {
              console.log('Found sitemap in robots.txt:', robotsSitemapUrl);
              
              const sitemapResponse = await safeFetch(robotsSitemapUrl, {
                headers: {
                  'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
                  'Accept': 'application/xml, text/xml, */*',
                },
              });

              if (sitemapResponse.ok) {
                sitemapContent = await sitemapResponse.text();
                successfulPath = robotsSitemapUrl;
              }
            } else {
              console.log('Invalid sitemap URL in robots.txt:', robotsSitemapUrl);
            }
          }
        }
      } catch (error) {
        console.log('Failed to check robots.txt:', error);
      }
    }

    if (!sitemapContent) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Geen sitemap.xml gevonden. Controleer of de website een sitemap heeft.',
          triedPaths: sitemapPaths
        }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse the sitemap XML
    const urls: SitemapUrl[] = [];
    
    // Check if it's a sitemap index (contains links to other sitemaps)
    if (sitemapContent.includes('<sitemapindex')) {
      console.log('Found sitemap index, parsing sub-sitemaps...');
      
      // Extract sitemap URLs from index
      const sitemapRegex = /<sitemap>\s*<loc>([^<]+)<\/loc>/g;
      let match;
      const subSitemapUrls: string[] = [];
      
      while ((match = sitemapRegex.exec(sitemapContent)) !== null) {
        const subUrl = match[1].trim();
        // Validate each sub-sitemap URL
        if (validateUrl(subUrl).valid) {
          subSitemapUrls.push(subUrl);
        }
      }

      console.log(`Found ${subSitemapUrls.length} valid sub-sitemaps`);

      // Fetch and parse each sub-sitemap (limit to first 5 to avoid timeout)
      for (const subUrl of subSitemapUrls.slice(0, 5)) {
        try {
          console.log('Fetching sub-sitemap:', subUrl);
          const subResponse = await fetch(subUrl, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; SEOBot/1.0)',
              'Accept': 'application/xml, text/xml, */*',
            },
          });

          if (subResponse.ok) {
            const subContent = await subResponse.text();
            parseUrlsFromSitemap(subContent, urls);
          }
        } catch (error) {
          console.log(`Failed to fetch sub-sitemap ${subUrl}:`, error);
        }
      }
    } else {
      // Regular sitemap
      parseUrlsFromSitemap(sitemapContent, urls);
    }

    console.log(`Parsed ${urls.length} URLs from sitemap`);

    // Deduplicate and filter URLs
    const uniqueUrls = Array.from(new Set(urls.map(u => u.loc)))
      .map(loc => urls.find(u => u.loc === loc)!)
      .filter(u => {
        // Filter out non-page URLs
        const lower = u.loc.toLowerCase();
        return !lower.endsWith('.pdf') && 
               !lower.endsWith('.jpg') && 
               !lower.endsWith('.jpeg') && 
               !lower.endsWith('.png') && 
               !lower.endsWith('.gif') && 
               !lower.endsWith('.svg') &&
               !lower.endsWith('.webp') &&
               !lower.includes('/wp-json/') &&
               !lower.includes('/feed/');
      });

    return new Response(
      JSON.stringify({ 
        success: true, 
        urls: uniqueUrls,
        totalFound: uniqueUrls.length,
        sitemapPath: successfulPath
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error parsing sitemap:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to parse sitemap';
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function parseUrlsFromSitemap(xmlContent: string, urls: SitemapUrl[]) {
  // Simple regex-based XML parsing for <url> elements
  const urlRegex = /<url>([\s\S]*?)<\/url>/g;
  let match;
  
  while ((match = urlRegex.exec(xmlContent)) !== null) {
    const urlBlock = match[1];
    
    const locMatch = urlBlock.match(/<loc>([^<]+)<\/loc>/);
    const lastmodMatch = urlBlock.match(/<lastmod>([^<]+)<\/lastmod>/);
    const priorityMatch = urlBlock.match(/<priority>([^<]+)<\/priority>/);
    
    if (locMatch && locMatch[1]) {
      urls.push({
        loc: locMatch[1].trim(),
        lastmod: lastmodMatch ? lastmodMatch[1].trim() : undefined,
        priority: priorityMatch ? priorityMatch[1].trim() : undefined,
      });
    }
  }
}
