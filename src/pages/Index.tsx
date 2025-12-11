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
      const seenTexts = new Set<string>();
      
      for (let i = headingIndex + 1; i < (nextHeadingIndex || allElements.length); i++) {
        const element = allElements[i];
        
        // Skip if element is a heading
        if (element.matches('h1, h2, h3, h4, h5, h6')) break;
        
        // Skip nested elements (only process leaf-like content)
        const isLeafElement = !element.querySelector('p, div, span, li, td, th');
        
        // Only include visible text content from paragraph-like elements
        if (element.matches('p, li, td, th') || (element.matches('div, span') && isLeafElement)) {
          // Get only direct text content to avoid duplication
          let elementText = '';
          
          // For leaf elements, get all text content
          if (isLeafElement) {
            elementText = element.textContent?.trim() || '';
          } else {
            // For elements with children, only get direct text nodes
            const directText = Array.from(element.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE)
              .map(node => node.textContent?.trim() || '')
              .filter(t => t.length > 0)
              .join(' ');
            elementText = directText;
          }
          
          // Only add meaningful text that we haven't seen before
          if (elementText && elementText.length > 10 && !seenTexts.has(elementText)) {
            // Check for substantial overlap with existing content
            const hasOverlap = contentElements.some(existing => 
              existing.includes(elementText) || elementText.includes(existing)
            );
            
            if (!hasOverlap) {
              contentElements.push(elementText);
              seenTexts.add(elementText);
            }
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

  // Normalize text for fuzzy keyword matching (remove Dutch stopwords, normalize spacing)
  const normalizeForMatching = (text: string): string => {
    const stopwords = ['in', 'de', 'het', 'een', 'van', 'en', 'op', 'te', 'voor', 'met', 'naar', 'aan', 'om', 'bij'];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove punctuation
      .split(/\s+/)
      .filter(word => !stopwords.includes(word))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Check if keyword matches text with fuzzy matching
  const fuzzyKeywordMatch = (text: string, keyword: string): boolean => {
    const normalizedText = normalizeForMatching(text);
    const normalizedKeyword = normalizeForMatching(keyword);
    
    console.log('Fuzzy match check:', { 
      originalText: text.substring(0, 100), 
      originalKeyword: keyword,
      normalizedText: normalizedText.substring(0, 100), 
      normalizedKeyword 
    });
    
    // Exact match after normalization
    if (normalizedText.includes(normalizedKeyword)) {
      console.log('Match found: exact normalized match');
      return true;
    }
    
    // Check if all keyword parts are present (handles compound word variations like "marketing bureau" vs "marketingbureau")
    const keywordParts = normalizedKeyword.split(' ').filter(p => p.length > 2);
    const textWords = normalizedText.split(' ');
    
    // Remove spaces from text to check for compound words (e.g., "marketingbureau" in text)
    const textWithoutSpaces = normalizedText.replace(/\s/g, '');
    const keywordWithoutSpaces = normalizedKeyword.replace(/\s/g, '');
    
    console.log('Compound check:', { textWithoutSpaces: textWithoutSpaces.substring(0, 50), keywordWithoutSpaces });
    
    // Check for compound variations (e.g., "marketingbureau" should match "marketing bureau")
    if (textWithoutSpaces.includes(keywordWithoutSpaces)) {
      console.log('Match found: compound match');
      return true;
    }
    
    // Check if text contains compound version of any adjacent keyword pairs
    for (let i = 0; i < keywordParts.length - 1; i++) {
      const compound = keywordParts[i] + keywordParts[i + 1];
      // Check in both the word list AND the continuous text (for compound words)
      const compoundInText = textWords.some(w => w.includes(compound)) || textWithoutSpaces.includes(compound);
      
      console.log(`Checking compound "${compound}":`, { compoundInText });
      
      if (compoundInText) {
        // Verify other parts are also present
        const remainingParts = [...keywordParts.slice(0, i), ...keywordParts.slice(i + 2)];
        const allRemainingPresent = remainingParts.every(part => 
          textWords.some(w => w.includes(part) || part.includes(w)) ||
          textWithoutSpaces.includes(part)
        );
        console.log('Remaining parts check:', { remainingParts, allRemainingPresent });
        if (allRemainingPresent) {
          console.log('Match found: compound + remaining parts');
          return true;
        }
      }
    }
    
    // All keyword parts should be present in the text (in words or as compounds)
    const allPartsPresent = keywordParts.every(part => 
      textWords.some(word => word.includes(part) || part.includes(word)) ||
      textWithoutSpaces.includes(part)
    );
    
    console.log('All parts check:', { keywordParts, allPartsPresent });
    return allPartsPresent;
  };

  const analyzeKeywordPlacement = (html: string, url: string, primaryKeyword: string): KeywordPlacementAnalysis | undefined => {
    // Only analyze if there's a primary keyword
    if (!primaryKeyword) return undefined;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    // Check if keyword is in URL (URLs typically have hyphens or no spaces)
    const urlLower = url.toLowerCase();
    const keywordForUrl = primaryKeyword.toLowerCase().replace(/\s+/g, '-');
    const keywordNoSpaces = primaryKeyword.toLowerCase().replace(/\s+/g, '');
    const inUrl = urlLower.includes(keywordForUrl) || 
                  urlLower.includes(keywordNoSpaces) ||
                  fuzzyKeywordMatch(urlLower.replace(/-/g, ' '), primaryKeyword);

    // Get H1 text
    const h1Element = doc.querySelector('h1');
    const h1Text = h1Element?.textContent?.trim() || '';
    const inH1 = fuzzyKeywordMatch(h1Text, primaryKeyword);

    // Get intro text (first paragraph-like content after H1)
    // Use a more comprehensive search to find content below H1
    let introText = '';
    if (h1Element) {
      const introTexts: string[] = [];
      
      // Method 1: Direct siblings
      let sibling = h1Element.nextElementSibling;
      let elementsChecked = 0;
      
      while (sibling && elementsChecked < 15) {
        if (sibling.matches('h1, h2, h3, h4, h5, h6')) break;
        
        // Include more element types for modern websites
        if (sibling.matches('p, div, span, section, article')) {
          const text = sibling.textContent?.trim() || '';
          if (text.length > 20) {
            introTexts.push(text);
            if (introTexts.join(' ').length > 300) break;
          }
        }
        
        sibling = sibling.nextElementSibling;
        elementsChecked++;
      }
      
      // Method 2: If no direct siblings found, check parent container's children
      if (introTexts.length === 0 && h1Element.parentElement) {
        const parent = h1Element.parentElement;
        const children = Array.from(parent.children);
        const h1Index = children.indexOf(h1Element);
        
        for (let i = h1Index + 1; i < Math.min(h1Index + 10, children.length); i++) {
          const child = children[i];
          if (child.matches('h1, h2, h3, h4, h5, h6')) break;
          
          const text = child.textContent?.trim() || '';
          if (text.length > 20) {
            introTexts.push(text);
            if (introTexts.join(' ').length > 300) break;
          }
        }
      }
      
      introText = introTexts.join(' ').substring(0, 500);
    }
    
    const inIntroText = introText.length > 0 && fuzzyKeywordMatch(introText, primaryKeyword);

    return {
      keyword: primaryKeyword,
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

  const analyzeUrl = async (url: string, primaryKeyword: string = '', secondaryKeywords: string[] = []) => {
    setIsLoading(true);
    setAnalysisData(null);

    try {
      const html = await fetchWithRetry(url);
      const headings = parseHeadings(html);
      const meta = parseMeta(html);
      const structuredData = parseStructuredData(html);
      
      // For keyword analysis, combine primary and secondary keywords
      const allKeywords = primaryKeyword 
        ? [primaryKeyword, ...secondaryKeywords] 
        : secondaryKeywords;
      const keywordScores = analyzeKeywords(html, allKeywords);
      
      // For keyword placement, only use primary keyword
      const keywordPlacement = analyzeKeywordPlacement(html, url, primaryKeyword);

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
