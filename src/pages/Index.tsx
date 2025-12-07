import { useState } from "react";
import { UrlAnalyzer } from "@/components/UrlAnalyzer";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Card } from "@/components/ui/card";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface HeadingInfo {
  level: number;
  text: string;
  position: { top: number; left: number };
  content?: string;
}

interface StructuredDataItem {
  type: string;
  data: any;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface KeywordScore {
  keyword: string;
  density: number;
  count: number;
  relevance: number;
  suggestions?: string[];
}

interface KeywordPlacementAnalysis {
  keyword: string;
  inUrl: boolean;
  inH1: boolean;
  inIntroText: boolean;
  url: string;
  h1Text?: string;
  introText?: string;
}

interface AnalysisData {
  url: string;
  screenshot?: string;
  headings: HeadingInfo[];
  meta: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  structuredData: StructuredDataItem[];
  html: string;
  faqs?: FaqItem[];
  keywords?: KeywordScore[];
  keywordPlacement?: KeywordPlacementAnalysis;
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);

  const parseHeadings = (html: string): HeadingInfo[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings: HeadingInfo[] = [];

    // Get all heading elements and all body elements
    const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const allElements = Array.from(doc.body.querySelectorAll('*'));
    
    headingElements.forEach((el, index) => {
      const tagName = el.tagName.toLowerCase();
      const level = parseInt(tagName.substring(1));
      const text = el.textContent?.trim() || '';
      
      // Skip empty headings
      if (!text) return;
      
      // Skip hidden elements
      const style = el.getAttribute('style') || '';
      const isHidden = 
        el.getAttribute('hide') === 'true' ||
        style.includes('display: none') ||
        style.includes('display:none') ||
        style.includes('visibility: hidden') ||
        style.includes('visibility:hidden') ||
        el.getAttribute('aria-hidden') === 'true' ||
        (el.getAttribute('class') || '').includes('hidden') ||
        (el.getAttribute('class') || '').includes('sr-only');
      
      if (isHidden) return;
      
      // Extract content between this heading and the next
      let content = "";
      const headingIndex = allElements.indexOf(el);
      const nextHeadingIndex = headingElements
        .slice(index + 1)
        .map(h => allElements.indexOf(h))
        .find(idx => idx > headingIndex);
      
      // Collect text content from elements between this heading and the next
      const contentElements: string[] = [];
      for (let i = headingIndex + 1; i < (nextHeadingIndex || allElements.length); i++) {
        const element = allElements[i];
        
        // Skip if element is a heading
        if (element.matches('h1, h2, h3, h4, h5, h6')) break;
        
        // Only include visible text content from paragraph-like elements
        if (element.matches('p, li, td, th')) {
          const elementText = element.textContent?.trim() || '';
          if (elementText && !contentElements.includes(elementText)) {
            contentElements.push(elementText);
          }
        }
      }
      
      content = contentElements.join('\n\n');
      
      headings.push({
        level,
        text,
        position: { top: index, left: 0 },
        content: content.trim() || undefined,
      });
    });

    return headings;
  };

  const parseMeta = (html: string) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const getMetaContent = (selector: string) => {
      const element = doc.querySelector(selector);
      return element?.getAttribute('content') || undefined;
    };

    const titleElement = doc.querySelector('title');
    const rawTitle = titleElement?.textContent?.trim() || undefined;

    return {
      title: rawTitle,
      description: getMetaContent('meta[name="description"]'),
      ogTitle: getMetaContent('meta[property="og:title"]'),
      ogDescription: getMetaContent('meta[property="og:description"]'),
      ogImage: getMetaContent('meta[property="og:image"]'),
    };
  };

  const parseStructuredData = (html: string): StructuredDataItem[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const typeMap = new Map<string, any>(); // Use Map to store unique types with their data

    // Parse JSON-LD
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    console.log('Found JSON-LD scripts:', jsonLdScripts.length);
    
    jsonLdScripts.forEach((script, scriptIndex) => {
      try {
        const data = JSON.parse(script.textContent || '');
        console.log(`Processing script ${scriptIndex}:`, data);
        
        // Helper function to extract types from data (only top-level items)
        const extractTypes = (obj: any, depth: number = 0): void => {
          if (Array.isArray(obj)) {
            // Handle arrays of structured data items
            obj.forEach(item => extractTypes(item, depth));
          } else if (obj && typeof obj === 'object') {
            // Handle @graph property (common in structured data)
            if (obj['@graph'] && Array.isArray(obj['@graph']) && depth === 0) {
              console.log('Found @graph with items:', obj['@graph'].length);
              obj['@graph'].forEach((item: any) => extractTypes(item, depth + 1));
            } else if (obj['@type']) {
              // Handle single or multiple types
              const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
              types.forEach((type: string) => {
                const typeLabel = `JSON-LD: ${type}`;
                console.log('Found type:', typeLabel, 'Already in map:', typeMap.has(typeLabel));
                // Only store the first occurrence of each type
                if (!typeMap.has(typeLabel)) {
                  typeMap.set(typeLabel, obj);
                }
              });
            }
          }
        };
        
        extractTypes(data);
      } catch (e) {
        console.error('Failed to parse JSON-LD:', e);
      }
    });

    console.log('Final typeMap size:', typeMap.size, 'Types:', Array.from(typeMap.keys()));

    // Convert Map to array of StructuredDataItem
    const structuredData: StructuredDataItem[] = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      data
    }));

    // Check for common microdata types
    const itemScopes = doc.querySelectorAll('[itemscope]');
    const microdataTypes = new Set<string>();
    itemScopes.forEach((element) => {
      const itemType = element.getAttribute('itemtype');
      if (itemType) {
        microdataTypes.add(itemType.split('/').pop() || 'Unknown');
      }
    });
    
    if (microdataTypes.size > 0) {
      structuredData.push({ 
        type: 'Microdata', 
        data: Array.from(microdataTypes) 
      });
    }

    return structuredData;
  };

  const analyzeKeywords = (html: string, keywords: string[]): KeywordScore[] => {
    if (keywords.length === 0) return [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const bodyText = doc.body.textContent?.toLowerCase() || '';
    const words = bodyText.split(/\s+/).filter(w => w.length > 0);
    const totalWords = words.length;

    return keywords.map(keyword => {
      const keywordLower = keyword.toLowerCase();
      const regex = new RegExp(`\\b${keywordLower}\\b`, 'gi');
      const matches = bodyText.match(regex) || [];
      const count = matches.length;
      const density = totalWords > 0 ? (count / totalWords) * 100 : 0;

      // Check presence in key locations
      const title = doc.querySelector('title');
      const inTitle = title?.textContent?.toLowerCase().includes(keywordLower) || false;

      const metaDesc = doc.querySelector('meta[name="description"]');
      const inMetaDesc = metaDesc?.getAttribute('content')?.toLowerCase().includes(keywordLower) || false;

      const h1Elements = doc.querySelectorAll('h1');
      const inH1 = Array.from(h1Elements).some(h => h.textContent?.toLowerCase().includes(keywordLower));

      const h2Elements = doc.querySelectorAll('h2');
      const inH2 = Array.from(h2Elements).some(h => h.textContent?.toLowerCase().includes(keywordLower));

      // Calculate relevance score
      let relevanceScore = 0;
      if (inTitle) relevanceScore += 25;
      if (inMetaDesc) relevanceScore += 15;
      if (inH1) relevanceScore += 20;
      if (inH2) relevanceScore += 10;
      relevanceScore += Math.min(count * 2, 30);

      // Generate suggestions based on analysis
      const suggestions: string[] = [];
      
      if (!inTitle) {
        suggestions.push(`Voeg "${keyword}" toe aan de title tag voor betere vindbaarheid`);
      }
      
      if (!inMetaDesc) {
        suggestions.push(`Voeg "${keyword}" toe aan de meta description`);
      }
      
      if (!inH1) {
        suggestions.push(`Gebruik "${keyword}" in minimaal één H1 heading`);
      }
      
      if (density > 3) {
        suggestions.push(`Verlaag de keyword density (nu ${density.toFixed(2)}%) om keyword stuffing te voorkomen`);
      } else if (density < 1 && count > 0) {
        suggestions.push(`Overweeg "${keyword}" vaker te gebruiken in de content (huidige density: ${density.toFixed(2)}%)`);
      } else if (count === 0) {
        suggestions.push(`Dit keyword komt niet voor op de pagina. Voeg relevante content toe met "${keyword}"`);
      }

      if (!inH2 && count > 0) {
        suggestions.push(`Versterk de structuur door "${keyword}" ook in H2 headings te gebruiken`);
      }

      return {
        keyword,
        density,
        count,
        relevance: Math.min(relevanceScore, 100),
        suggestions: suggestions.length > 0 ? suggestions : undefined
      };
    });
  };

  const analyzeKeywordPlacement = (html: string, url: string, keywords: string[]): KeywordPlacementAnalysis | undefined => {
    // Only analyze if there's at least one keyword (use the first/primary keyword)
    if (keywords.length === 0) return undefined;

    const primaryKeyword = keywords[0].toLowerCase();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check if keyword is in URL
    const urlLower = url.toLowerCase();
    const inUrl = urlLower.includes(primaryKeyword.replace(/\s+/g, '-')) || 
                  urlLower.includes(primaryKeyword.replace(/\s+/g, '')) ||
                  urlLower.includes(primaryKeyword);

    // Get H1 text
    const h1Element = doc.querySelector('h1');
    const h1Text = h1Element?.textContent?.trim() || '';
    const inH1 = h1Text.toLowerCase().includes(primaryKeyword);

    // Get intro text (first paragraph-like content after H1)
    let introText = '';
    if (h1Element) {
      // Find the next sibling elements after H1
      let sibling = h1Element.nextElementSibling;
      const introTexts: string[] = [];
      let elementsChecked = 0;
      
      while (sibling && elementsChecked < 10) {
        // Stop if we hit another heading
        if (sibling.matches('h1, h2, h3, h4, h5, h6')) break;
        
        // Check for paragraph or div with text content
        if (sibling.matches('p, div')) {
          const text = sibling.textContent?.trim() || '';
          if (text.length > 20) { // Only include meaningful text
            introTexts.push(text);
            if (introTexts.join(' ').length > 200) break; // Limit intro text length
          }
        }
        
        sibling = sibling.nextElementSibling;
        elementsChecked++;
      }
      
      introText = introTexts.join(' ').substring(0, 500);
    }
    
    const inIntroText = introText.toLowerCase().includes(primaryKeyword);

    return {
      keyword: keywords[0],
      inUrl,
      inH1,
      inIntroText,
      url,
      h1Text: h1Text || undefined,
      introText: introText || undefined,
    };
  };

  const fetchWithRetry = async (url: string, maxRetries: number = 3): Promise<string> => {
    const corsProxies = [
      (u: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
      (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
      (u: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
    ];

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      for (const proxyFn of corsProxies) {
        try {
          const proxyUrl = proxyFn(url);
          console.log(`Poging ${attempt + 1}, proxy: ${proxyUrl.split('?')[0]}`);
          
          const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(15000), // 15 second timeout
          });
          
          if (response.ok) {
            const html = await response.text();
            if (html && html.length > 100) {
              return html;
            }
          }
        } catch (error) {
          console.warn(`Proxy mislukt:`, error);
          lastError = error as Error;
        }
      }
      
      // Wait before retrying all proxies
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw lastError || new Error('Kon de website niet ophalen na meerdere pogingen');
  };

  const analyzeUrl = async (url: string, keywords: string[] = []) => {
    setIsLoading(true);
    setAnalysisData(null);

    try {
      const html = await fetchWithRetry(url);
      const headings = parseHeadings(html);
      const meta = parseMeta(html);
      const structuredData = parseStructuredData(html);
      const keywordScores = analyzeKeywords(html, keywords);
      const keywordPlacement = analyzeKeywordPlacement(html, url, keywords);

      // For screenshot, we would normally use a service like Puppeteer or a screenshot API
      // For now, we'll note that this needs to be implemented with a backend service
      const screenshotPlaceholder = undefined;

      const data: AnalysisData = {
        url,
        screenshot: screenshotPlaceholder,
        headings,
        meta,
        structuredData,
        html,
        keywords: keywordScores,
        keywordPlacement,
      };

      setAnalysisData(data);
      toast.success("Analyse voltooid!");
      
      // Generate FAQs automatically
      generateFaqs(html, data);
      
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Analyse fout:', error);
      toast.error("Er is een fout opgetreden bij het analyseren van de URL. Probeer het opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  const generateFaqs = async (html: string, currentData: AnalysisData) => {
    setIsGeneratingFaqs(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-faqs', {
        body: { html }
      });

      if (error) throw error;

      setAnalysisData({
        ...currentData,
        faqs: data.faqs
      });
      toast.success("FAQ suggesties gegenereerd!");
    } catch (error) {
      console.error('FAQ generatie fout:', error);
      toast.error("Fout bij het genereren van FAQ's");
    } finally {
      setIsGeneratingFaqs(false);
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleFaqsUpdate = (updatedFaqs: FaqItem[]) => {
    if (analysisData) {
      setAnalysisData({
        ...analysisData,
        faqs: updatedFaqs
      });
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto">
        <div className="fixed top-4 right-4 z-50">
          <ThemeToggle />
        </div>
        
        <div className="mb-16">
          <UrlAnalyzer onAnalyze={analyzeUrl} isLoading={isLoading} />
        </div>

        {analysisData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <AnalysisResults 
              data={analysisData} 
              onReset={handleReset}
              onFaqsUpdate={handleFaqsUpdate}
            />
            
            {isGeneratingFaqs && (
              <Card className="p-6">
                <div className="flex items-center justify-center gap-3">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
                  <p className="text-muted-foreground">FAQ's genereren...</p>
                </div>
              </Card>
            )}
          </div>
        )}

        {!analysisData && !isLoading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full gradient-primary mb-6 shadow-glow">
              <svg 
                className="w-10 h-10 text-white" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" 
                />
              </svg>
            </div>
            <h2 className="text-2xl font-semibold mb-3">Klaar om te beginnen?</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Voer een URL in om de technische SEO structuur te analyseren en inzicht te krijgen in heading hierarchie, meta data en meer.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
