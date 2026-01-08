import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { UrlAnalyzer } from "@/components/UrlAnalyzer";
import { WebsiteAnalyzer } from "@/components/WebsiteAnalyzer";
import { SitemapUrlList } from "@/components/SitemapUrlList";
import { WebsiteAnalysisResults, PageAnalysisResult } from "@/components/WebsiteAnalysisResults";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { SitemapUrl } from "@/lib/api/sitemap";
import { FileText, Globe, LogOut, Save, Loader2, FolderOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(null);
  
  // Website analysis state
  const [discoveredUrls, setDiscoveredUrls] = useState<SitemapUrl[]>([]);
  const [websiteBaseUrl, setWebsiteBaseUrl] = useState<string>("");
  const [isAnalyzingWebsite, setIsAnalyzingWebsite] = useState(false);
  const [analyzedPagesCount, setAnalyzedPagesCount] = useState(0);
  const [websiteResults, setWebsiteResults] = useState<PageAnalysisResult[]>([]);
  const [showWebsiteResults, setShowWebsiteResults] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [projectName, setProjectName] = useState<string>("");
  const shouldStopAnalysisRef = useRef(false);

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
          // Always use full textContent to include text from inline elements like <a>, <strong>, <em>
          const elementText = element.textContent?.trim() || '';
          
          // Skip if this text matches or contains any heading text (prevents next heading from appearing in content)
          const isHeadingText = headingElements.some(h => {
            const headingText = h.textContent?.trim() || '';
            return headingText && (elementText === headingText || elementText.includes(headingText));
          });
          
          if (elementText && elementText.length > 10 && !seenTexts.has(elementText) && !isHeadingText) {
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

      const title = doc.querySelector('title');
      const inTitle = title?.textContent?.toLowerCase().includes(keywordLower) || false;

      const metaDesc = doc.querySelector('meta[name="description"]');
      const inMetaDesc = metaDesc?.getAttribute('content')?.toLowerCase().includes(keywordLower) || false;

      const h1Elements = doc.querySelectorAll('h1');
      const inH1 = Array.from(h1Elements).some(h => h.textContent?.toLowerCase().includes(keywordLower));

      const h2Elements = doc.querySelectorAll('h2');
      const inH2 = Array.from(h2Elements).some(h => h.textContent?.toLowerCase().includes(keywordLower));

      let relevanceScore = 0;
      if (inTitle) relevanceScore += 25;
      if (inMetaDesc) relevanceScore += 15;
      if (inH1) relevanceScore += 20;
      if (inH2) relevanceScore += 10;
      relevanceScore += Math.min(count * 2, 30);

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

  const normalizeForMatching = (text: string): string => {
    const stopwords = ['in', 'de', 'het', 'een', 'van', 'en', 'op', 'te', 'voor', 'met', 'naar', 'aan', 'om', 'bij'];
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => !stopwords.includes(word))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim();
  };

  const fuzzyKeywordMatch = (text: string, keyword: string): boolean => {
    const normalizedText = normalizeForMatching(text);
    const normalizedKeyword = normalizeForMatching(keyword);
    
    if (normalizedText.includes(normalizedKeyword)) {
      return true;
    }
    
    const textWithoutSpaces = normalizedText.replace(/\s/g, '');
    const keywordWithoutSpaces = normalizedKeyword.replace(/\s/g, '');
    if (textWithoutSpaces.includes(keywordWithoutSpaces)) {
      return true;
    }
    
    const keywordParts = normalizedKeyword.split(' ').filter(p => p.length > 2);
    const textWords = normalizedText.split(' ');
    
    if (keywordParts.length === 0) return false;
    
    const allPartsFound = keywordParts.every(part => {
      const foundInWord = textWords.some(word => word.includes(part));
      const foundInContinuous = textWithoutSpaces.includes(part);
      return foundInWord || foundInContinuous;
    });
    
    return allPartsFound;
  };

  const analyzeKeywordPlacement = (html: string, url: string, primaryKeyword: string): KeywordPlacementAnalysis | undefined => {
    if (!primaryKeyword) return undefined;

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    const urlLower = url.toLowerCase();
    const keywordForUrl = primaryKeyword.toLowerCase().replace(/\s+/g, '-');
    const keywordNoSpaces = primaryKeyword.toLowerCase().replace(/\s+/g, '');
    const inUrl = urlLower.includes(keywordForUrl) || 
                  urlLower.includes(keywordNoSpaces) ||
                  fuzzyKeywordMatch(urlLower.replace(/-/g, ' '), primaryKeyword);

    const h1Element = doc.querySelector('h1');
    const h1Text = h1Element?.textContent?.trim() || '';
    const inH1 = fuzzyKeywordMatch(h1Text, primaryKeyword);

    let introText = '';
    if (h1Element) {
      const introTexts: string[] = [];
      
      let sibling = h1Element.nextElementSibling;
      let elementsChecked = 0;
      
      while (sibling && elementsChecked < 15) {
        if (sibling.matches('h1, h2, h3, h4, h5, h6')) break;
        
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
            signal: AbortSignal.timeout(15000),
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
      
      const allKeywords = primaryKeyword 
        ? [primaryKeyword, ...secondaryKeywords] 
        : secondaryKeywords;
      const keywordScores = analyzeKeywords(html, allKeywords);
      
      const keywordPlacement = analyzeKeywordPlacement(html, url, primaryKeyword);

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
      
      generateFaqs(html, data);
      
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

  const handleUrlsDiscovered = (baseUrl: string, urls: SitemapUrl[]) => {
    setWebsiteBaseUrl(baseUrl);
    setDiscoveredUrls(urls);
    // Set default project name from hostname
    try {
      const urlObj = new URL(baseUrl);
      setProjectName(urlObj.hostname);
    } catch {
      setProjectName(baseUrl);
    }
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

  const analyzePageForWebsite = (html: string, url: string): PageAnalysisResult => {
    const headings = parseHeadings(html);
    const meta = parseMeta(html);
    const structuredData = parseStructuredData(html);
    
    const hasH1 = headings.some(h => h.level === 1);
    const hasMetaDescription = !!meta.description;
    const hasStructuredDataFlag = structuredData.length > 0;
    
    // Calculate heading issues
    let headingIssues = 0;
    const h1Count = headings.filter(h => h.level === 1).length;
    if (h1Count === 0) headingIssues++;
    if (h1Count > 1) headingIssues++;
    
    // Check for skipped levels
    const levels = headings.map(h => h.level).sort((a, b) => a - b);
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i-1] > 1) headingIssues++;
    }
    
    const seoScore = calculateSeoScore(hasH1, hasMetaDescription, hasStructuredDataFlag, headingIssues);
    
    // Create full analysis data for storage
    const analysisData: AnalysisData = {
      url,
      headings,
      meta,
      structuredData,
      html: '', // Don't store full HTML to save space
    };
    
    return {
      url,
      title: meta.title,
      status: 'success',
      seoScore,
      hasH1,
      hasMetaDescription,
      hasStructuredData: hasStructuredDataFlag,
      headingIssues,
      analysisData,
    };
  };

  const handleAnalyzeSelectedUrls = async (urls: string[]) => {
    setIsAnalyzingWebsite(true);
    setAnalyzedPagesCount(0);
    setWebsiteResults([]);
    setShowWebsiteResults(false);
    shouldStopAnalysisRef.current = false;
    
    toast.info(`Start analyse van ${urls.length} pagina's...`);
    
    const results: PageAnalysisResult[] = [];
    let wasStopped = false;
    
    for (let i = 0; i < urls.length; i++) {
      // Check if analysis should be stopped
      if (shouldStopAnalysisRef.current) {
        wasStopped = true;
        break;
      }
      
      const url = urls[i];
      try {
        console.log(`Analyzing page ${i + 1}/${urls.length}: ${url}`);
        const html = await fetchWithRetry(url);
        const result = analyzePageForWebsite(html, url);
        results.push(result);
      } catch (error) {
        console.error(`Failed to analyze ${url}:`, error);
        results.push({
          url,
          status: 'error',
          errorMessage: 'Kon pagina niet ophalen',
          hasH1: false,
          hasMetaDescription: false,
          hasStructuredData: false,
          headingIssues: 0,
        });
      }
      
      setAnalyzedPagesCount(i + 1);
      setWebsiteResults([...results]);
      
      // Small delay between requests
      if (i < urls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
    
    if (wasStopped) {
      toast.info(`Analyse gestopt na ${results.length} pagina's`);
    } else {
      toast.success(`${urls.length} pagina's geanalyseerd!`);
    }
    setIsAnalyzingWebsite(false);
    setShowWebsiteResults(true);
    shouldStopAnalysisRef.current = false;
  };

  const handleStopAnalysis = () => {
    shouldStopAnalysisRef.current = true;
    toast.info("Analyse wordt gestopt...");
  };

  const handleViewPageDetails = async (url: string) => {
    // Analyze single page in detail
    await analyzeUrl(url);
  };

  const { signOut, user } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Uitgelogd");
  };

  const handleSaveProject = async () => {
    if (!user || websiteResults.length === 0 || !projectName.trim()) return;
    
    setIsSavingProject(true);
    
    try {
      // Create project
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: user.id,
          name: projectName.trim(),
          base_url: websiteBaseUrl,
          total_pages: websiteResults.length,
          analyzed_pages: websiteResults.filter(r => r.status === 'success').length,
          status: 'completed'
        })
        .select()
        .single();
      
      if (projectError) throw projectError;
      
      // Create project pages - map status to valid database values
      const pagesToInsert = websiteResults.map(result => ({
        project_id: project.id,
        url: result.url,
        title: result.title || null,
        status: result.status === 'success' ? 'completed' : result.status === 'error' ? 'failed' : result.status,
        seo_score: result.seoScore || null,
        has_h1: result.hasH1,
        has_meta_description: result.hasMetaDescription,
        has_structured_data: result.hasStructuredData,
        heading_issues: result.headingIssues,
        error_message: result.errorMessage || null,
        analysis_data: result.analysisData || null,
      }));
      
      const { error: pagesError } = await supabase
        .from('project_pages')
        .insert(pagesToInsert);
      
      if (pagesError) throw pagesError;
      
      toast.success("Project opgeslagen!");
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error("Fout bij opslaan van project");
    } finally {
      setIsSavingProject(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="container mx-auto">
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline">
            {user?.email}
          </span>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Uitloggen">
            <LogOut className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>
        
        <div className="mb-16">
          <Tabs defaultValue="single" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8">
              <TabsTrigger value="single" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Enkele pagina
              </TabsTrigger>
              <TabsTrigger value="website" className="flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Volledige website
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="single">
              <UrlAnalyzer onAnalyze={analyzeUrl} isLoading={isLoading} />
            </TabsContent>
            
            <TabsContent value="website">
              <WebsiteAnalyzer 
                onUrlsDiscovered={handleUrlsDiscovered} 
                isLoading={isAnalyzingWebsite} 
              />
              
              {discoveredUrls.length > 0 && !showWebsiteResults && (
                <div className="mt-8">
                  <SitemapUrlList
                    baseUrl={websiteBaseUrl}
                    urls={discoveredUrls}
                    onAnalyzeSelected={handleAnalyzeSelectedUrls}
                    onStopAnalysis={handleStopAnalysis}
                    isAnalyzing={isAnalyzingWebsite}
                    analyzedCount={analyzedPagesCount}
                  />
                </div>
              )}
              
              {(showWebsiteResults || (isAnalyzingWebsite && websiteResults.length > 0)) && (
                <div className="mt-8 space-y-4">
                  <WebsiteAnalysisResults 
                    results={websiteResults}
                    onViewDetails={handleViewPageDetails}
                  />
                  
                  {showWebsiteResults && websiteResults.length > 0 && (
                    <div className="flex flex-col items-center gap-4 p-6 border rounded-lg bg-card">
                      <div className="flex items-center gap-2 text-lg font-medium">
                        <FolderOpen className="h-5 w-5 text-primary" />
                        Project opslaan
                      </div>
                      <div className="w-full max-w-md space-y-2">
                        <Label htmlFor="projectName">Projectnaam</Label>
                        <Input
                          id="projectName"
                          type="text"
                          placeholder="Voer een projectnaam in..."
                          value={projectName}
                          onChange={(e) => setProjectName(e.target.value)}
                          className="text-center"
                        />
                      </div>
                      <Button 
                        onClick={handleSaveProject}
                        disabled={isSavingProject || !projectName.trim()}
                        className="gradient-primary"
                        size="lg"
                      >
                        {isSavingProject ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Project opslaan...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Project opslaan
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>
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

        {!analysisData && !isLoading && discoveredUrls.length === 0 && (
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
              Kies hierboven voor een enkele pagina analyse of ontdek alle pagina's van een website via sitemap.xml.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
