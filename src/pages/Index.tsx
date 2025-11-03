import { useState } from "react";
import { UrlAnalyzer } from "@/components/UrlAnalyzer";
import { AnalysisResults } from "@/components/AnalysisResults";
import { toast } from "sonner";

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
}

const Index = () => {
  const [isLoading, setIsLoading] = useState(false);
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
    const structuredData: StructuredDataItem[] = [];

    // Parse JSON-LD
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    jsonLdScripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || '');
        
        // Helper function to extract types from data
        const extractTypes = (obj: any): void => {
          if (Array.isArray(obj)) {
            // Handle arrays of structured data items
            obj.forEach(item => extractTypes(item));
          } else if (obj && typeof obj === 'object') {
            // Handle @graph property (common in structured data)
            if (obj['@graph'] && Array.isArray(obj['@graph'])) {
              obj['@graph'].forEach((item: any) => extractTypes(item));
            } else if (obj['@type']) {
              // Handle single or multiple types
              const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
              types.forEach((type: string) => {
                structuredData.push({ type: `JSON-LD: ${type}`, data: obj });
              });
            }
          }
        };
        
        extractTypes(data);
      } catch (e) {
        console.error('Failed to parse JSON-LD:', e);
      }
    });

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

  const analyzeUrl = async (url: string) => {
    setIsLoading(true);
    setAnalysisData(null);

    try {
      // Use a CORS proxy for fetching the website
      const corsProxy = 'https://api.allorigins.win/raw?url=';
      const response = await fetch(corsProxy + encodeURIComponent(url));
      
      if (!response.ok) {
        throw new Error('Kon de website niet ophalen');
      }

      const html = await response.text();
      const headings = parseHeadings(html);
      const meta = parseMeta(html);
      const structuredData = parseStructuredData(html);

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
      };

      setAnalysisData(data);
      toast.success("Analyse voltooid!");
      
      // Scroll to results
      setTimeout(() => {
        window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Analyse fout:', error);
      toast.error("Er is een fout opgetreden bij het analyseren van de URL");
    } finally {
      setIsLoading(false);
    }
  };

  const handleReset = () => {
    setAnalysisData(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto">
        <div className="mb-16">
          <UrlAnalyzer onAnalyze={analyzeUrl} isLoading={isLoading} />
        </div>

        {analysisData && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <AnalysisResults data={analysisData} onReset={handleReset} />
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
