import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Globe, AlertCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

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

interface PageData {
  id: string;
  url: string;
  title: string | null;
  analysis_data: any;
  project_id: string;
}

interface ProjectData {
  name: string;
  base_url: string;
}

const PageDetails = () => {
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (pageId) {
      fetchPageData();
    }
  }, [pageId]);

  const fetchPageData = async () => {
    try {
      const { data: page, error: pageError } = await supabase
        .from("project_pages")
        .select("id, url, title, analysis_data, project_id")
        .eq("id", pageId)
        .single();

      if (pageError) throw pageError;
      if (!page) throw new Error("Pagina niet gevonden");

      setPageData(page);

      // Fetch project info
      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("name, base_url")
        .eq("id", page.project_id)
        .single();

      if (!projectError && project) {
        setProjectData(project);
      }
    } catch (err: any) {
      console.error("Error fetching page data:", err);
      setError(err.message || "Kon pagina niet laden");
      toast.error("Kon pagina niet laden");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigate("/");
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
          const response = await fetch(proxyUrl, {
            signal: AbortSignal.timeout(15000),
          });
          
          if (response.ok) {
            const html = await response.text();
            if (html && html.length > 100) {
              return html;
            }
          }
        } catch (error) {
          lastError = error as Error;
        }
      }
      
      if (attempt < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    throw lastError || new Error('Kon de website niet ophalen na meerdere pogingen');
  };

  const parseHeadings = (html: string): HeadingInfo[] => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const headings: HeadingInfo[] = [];

    const headingElements = Array.from(doc.querySelectorAll('h1, h2, h3, h4, h5, h6'));
    const allElements = Array.from(doc.body.querySelectorAll('*'));
    
    headingElements.forEach((el, index) => {
      const tagName = el.tagName.toLowerCase();
      const level = parseInt(tagName.substring(1));
      const text = el.textContent?.trim() || '';
      
      if (!text) return;
      
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
      
      let content = "";
      const headingIndex = allElements.indexOf(el);
      const nextHeadingIndex = headingElements
        .slice(index + 1)
        .map(h => allElements.indexOf(h))
        .find(idx => idx > headingIndex);
      
      const contentElements: string[] = [];
      const seenTexts = new Set<string>();
      
      for (let i = headingIndex + 1; i < (nextHeadingIndex || allElements.length); i++) {
        const element = allElements[i];
        
        if (element.matches('h1, h2, h3, h4, h5, h6')) break;
        
        const isLeafElement = !element.querySelector('p, div, span, li, td, th');
        
        if (element.matches('p, li, td, th') || (element.matches('div, span') && isLeafElement)) {
          let elementText = '';
          
          if (isLeafElement) {
            elementText = element.textContent?.trim() || '';
          } else {
            const directText = Array.from(element.childNodes)
              .filter(node => node.nodeType === Node.TEXT_NODE)
              .map(node => node.textContent?.trim() || '')
              .filter(t => t.length > 0)
              .join(' ');
            elementText = directText;
          }
          
          if (elementText && elementText.length > 10 && !seenTexts.has(elementText)) {
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
    const typeMap = new Map<string, any>();

    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    
    jsonLdScripts.forEach((script) => {
      try {
        const data = JSON.parse(script.textContent || '');
        
        const extractTypes = (obj: any, depth: number = 0): void => {
          if (Array.isArray(obj)) {
            obj.forEach(item => extractTypes(item, depth));
          } else if (obj && typeof obj === 'object') {
            if (obj['@graph'] && Array.isArray(obj['@graph']) && depth === 0) {
              obj['@graph'].forEach((item: any) => extractTypes(item, depth + 1));
            } else if (obj['@type']) {
              const types = Array.isArray(obj['@type']) ? obj['@type'] : [obj['@type']];
              types.forEach((type: string) => {
                const typeLabel = `JSON-LD: ${type}`;
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

    const structuredData: StructuredDataItem[] = Array.from(typeMap.entries()).map(([type, data]) => ({
      type,
      data
    }));

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

  const calculateSeoScore = (
    hasH1: boolean, 
    hasMetaDesc: boolean, 
    hasStructuredData: boolean, 
    headingIssues: number
  ): number => {
    let score = 0;
    if (hasH1) score += 25;
    if (hasMetaDesc) score += 25;
    if (hasStructuredData) score += 25;
    score += Math.max(0, 25 - (headingIssues * 5));
    return Math.max(0, Math.min(100, score));
  };

  const handleReanalyze = async () => {
    if (!pageData) return;
    
    setIsReanalyzing(true);
    
    try {
      toast.info("Pagina wordt opnieuw geanalyseerd...");
      
      const html = await fetchWithRetry(pageData.url);
      const headings = parseHeadings(html);
      const meta = parseMeta(html);
      const structuredData = parseStructuredData(html);
      
      const hasH1 = headings.some(h => h.level === 1);
      const hasMetaDescription = !!meta.description;
      const hasStructuredDataFlag = structuredData.length > 0;
      
      let headingIssues = 0;
      const h1Count = headings.filter(h => h.level === 1).length;
      if (h1Count === 0) headingIssues++;
      if (h1Count > 1) headingIssues++;
      
      const levels = headings.map(h => h.level).sort((a, b) => a - b);
      for (let i = 1; i < levels.length; i++) {
        if (levels[i] - levels[i-1] > 1) headingIssues++;
      }
      
      const seoScore = calculateSeoScore(hasH1, hasMetaDescription, hasStructuredDataFlag, headingIssues);
      
      const newAnalysisData: AnalysisData = {
        url: pageData.url,
        headings,
        meta,
        structuredData,
        html: '',
      };
      
      // Update database
      const { error: updateError } = await supabase
        .from('project_pages')
        .update({
          analysis_data: JSON.parse(JSON.stringify(newAnalysisData)),
          title: meta.title || null,
          seo_score: seoScore,
          has_h1: hasH1,
          has_meta_description: hasMetaDescription,
          has_structured_data: hasStructuredDataFlag,
          heading_issues: headingIssues,
          status: 'completed',
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageData.id);
      
      if (updateError) throw updateError;
      
      // Update local state
      setPageData({
        ...pageData,
        title: meta.title || null,
        analysis_data: newAnalysisData,
      });
      
      toast.success("Pagina opnieuw geanalyseerd!");
    } catch (err: any) {
      console.error("Error reanalyzing page:", err);
      toast.error("Fout bij heranalyse: " + (err.message || "Onbekende fout"));
    } finally {
      setIsReanalyzing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">SEO Analyzer</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">SEO Analyzer</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Fout bij laden</h2>
            <p className="text-muted-foreground mb-4">{error || "Pagina niet gevonden"}</p>
            <Button onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Terug naar Dashboard
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  // Check if we have analysis data
  if (!pageData.analysis_data) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Globe className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold">SEO Analyzer</h1>
            </div>
            <ThemeToggle />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8">
          <Button variant="ghost" onClick={handleBack} className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Terug naar {projectData?.name || "Dashboard"}
          </Button>
          <Card className="p-8 text-center">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold mb-2">Geen analysegegevens beschikbaar</h2>
            <p className="text-muted-foreground mb-4">
              Voor deze pagina zijn geen gedetailleerde analysegegevens opgeslagen. 
              Analyseer de website opnieuw om volledige details te zien.
            </p>
            <Button onClick={() => navigate("/analyze")}>
              Nieuwe Analyse Starten
            </Button>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">SEO Analyzer</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <Button variant="ghost" onClick={handleBack} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Terug naar {projectData?.name || "Dashboard"}
        </Button>

        <AnalysisResults 
          data={pageData.analysis_data}
          onReset={handleBack}
          onReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
        />
      </main>
    </div>
  );
};

export default PageDetails;
