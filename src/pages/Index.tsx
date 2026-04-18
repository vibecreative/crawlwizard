import { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate, useSearchParams } from "react-router-dom";
import { UrlAnalyzer } from "@/components/UrlAnalyzer";
import { WebsiteAnalyzer } from "@/components/WebsiteAnalyzer";
import { SitemapUrlList } from "@/components/SitemapUrlList";
import { WebsiteAnalysisResults, PageAnalysisResult } from "@/components/WebsiteAnalysisResults";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import type { AnalysisData, FaqItem } from "@/types/analysis";
import {
  parseHeadings,
  parseMeta,
  parseStructuredData,
  analyzeKeywords,
  analyzeKeywordPlacement,
  calculateSeoScore,
  calculateHeadingIssues,
  fetchPageHtml,
} from "@/lib/htmlParser";

const Index = () => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const viewAsUserId = searchParams.get("viewAs");
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
  const [userPlan, setUserPlan] = useState<string>("free");
  const [isAdmin, setIsAdmin] = useState(false);
  const [viewAsName, setViewAsName] = useState<string | null>(null);

  const { signOut, user } = useAuth();

  useEffect(() => {
    if (user?.id) {
      supabase.from('profiles').select('plan').eq('id', user.id).single()
        .then(({ data }) => { if (data) setUserPlan(data.plan); });
      supabase.rpc('has_role', { _user_id: user.id, _role: 'admin' })
        .then(({ data }) => setIsAdmin(!!data));
    }
  }, [user?.id]);

  // When admin is impersonating, fetch the target user's profile + use their plan
  useEffect(() => {
    if (isAdmin && viewAsUserId) {
      supabase.from('profiles').select('plan, full_name, company_name').eq('id', viewAsUserId).single()
        .then(({ data }) => {
          if (data) {
            setUserPlan(data.plan);
            setViewAsName(data.full_name || data.company_name || viewAsUserId);
          }
        });
    }
  }, [isAdmin, viewAsUserId]);

  // ── Single Page Analysis ─────────────────────────────────────────────────

  const analyzeUrl = async (url: string, primaryKeyword = '', secondaryKeywords: string[] = []) => {
    setIsLoading(true);
    setAnalysisData(null);

    try {
      const html = await fetchPageHtml(url);
      const headings = parseHeadings(html);
      const meta = parseMeta(html);
      const structuredData = parseStructuredData(html);
      
      const allKeywords = primaryKeyword 
        ? [primaryKeyword, ...secondaryKeywords] 
        : secondaryKeywords;
      const keywordScores = analyzeKeywords(html, allKeywords);
      const keywordPlacement = analyzeKeywordPlacement(html, url, primaryKeyword);

      const data: AnalysisData = {
        url,
        screenshot: undefined,
        headings,
        meta,
        structuredData,
        html,
        keywords: keywordScores,
        keywordPlacement,
      };

      setAnalysisData(data);
      toast.success("Analyse voltooid!");
      
      setTimeout(() => {
        document.getElementById('analysis-results')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    } catch (error) {
      console.error('Analyse fout:', error);
      toast.error("Er is een fout opgetreden bij het analyseren van de URL. Probeer het opnieuw.");
    } finally {
      setIsLoading(false);
    }
  };

  // ── FAQ Generation ───────────────────────────────────────────────────────

  const generateFaqs = async () => {
    if (!analysisData?.html) {
      toast.error("Geen HTML beschikbaar voor FAQ generatie");
      return;
    }
    
    setIsGeneratingFaqs(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-faqs', {
        body: { html: analysisData.html, language: i18n.language }
      });

      if (error) throw error;

      setAnalysisData({ ...analysisData, faqs: data.faqs });
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
      setAnalysisData({ ...analysisData, faqs: updatedFaqs });
    }
  };

  // ── Website Analysis ─────────────────────────────────────────────────────

  const handleUrlsDiscovered = (baseUrl: string, urls: SitemapUrl[]) => {
    setWebsiteBaseUrl(baseUrl);
    setDiscoveredUrls(urls);
    try {
      setProjectName(new URL(baseUrl).hostname);
    } catch {
      setProjectName(baseUrl);
    }
  };

  const analyzePageForWebsite = (html: string, url: string): PageAnalysisResult => {
    const headings = parseHeadings(html);
    const meta = parseMeta(html);
    const structuredData = parseStructuredData(html);
    
    const hasH1 = headings.some(h => h.level === 1);
    const hasMetaDescription = !!meta.description;
    const hasStructuredDataFlag = structuredData.length > 0;
    const headingIssues = calculateHeadingIssues(headings);
    const seoScore = calculateSeoScore(hasH1, hasMetaDescription, hasStructuredDataFlag, headingIssues);
    
    const pageAnalysisData: AnalysisData = {
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
      analysisData: pageAnalysisData,
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
      if (shouldStopAnalysisRef.current) {
        wasStopped = true;
        break;
      }
      
      const url = urls[i];
      try {
        const html = await fetchPageHtml(url);
        results.push(analyzePageForWebsite(html, url));
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
    await analyzeUrl(url);
  };

  const handleSignOut = async () => {
    await signOut();
    toast.success("Uitgelogd");
  };

  // ── Save Project ─────────────────────────────────────────────────────────

  const handleSaveProject = async () => {
    if (!user || websiteResults.length === 0 || !projectName.trim()) return;
    
    setIsSavingProject(true);
    
    try {
      const targetUserId = (isAdmin && viewAsUserId) ? viewAsUserId : user.id;
      const { data: project, error: projectError } = await supabase
        .from('projects')
        .insert({
          user_id: targetUserId,
          name: projectName.trim(),
          base_url: websiteBaseUrl,
          total_pages: websiteResults.length,
          analyzed_pages: websiteResults.filter(r => r.status === 'success').length,
          status: 'completed'
        })
        .select()
        .single();
      
      if (projectError) throw projectError;
      
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
      navigate(isAdmin && viewAsUserId ? `/dashboard?viewAs=${viewAsUserId}` : '/dashboard');
    } catch (error) {
      console.error('Error saving project:', error);
      toast.error("Fout bij opslaan van project");
    } finally {
      setIsSavingProject(false);
    }
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-16 sm:pt-12 pb-12 px-3 sm:px-4">
      <SEOHead title="Analyse" noindex />
      <div className="container mx-auto">
        <div className="fixed top-3 right-3 sm:top-4 sm:right-4 z-50 flex items-center gap-1.5 sm:gap-2 bg-background/80 backdrop-blur-sm rounded-lg px-2 py-1.5 border border-border/50">
          <span className="text-xs text-muted-foreground hidden sm:inline truncate max-w-[150px]">
            {user?.email}
          </span>
          <Button variant="ghost" size="icon" onClick={handleSignOut} title="Uitloggen" className="h-8 w-8">
            <LogOut className="h-4 w-4" />
          </Button>
          <ThemeToggle />
        </div>

        {isAdmin && viewAsUserId && viewAsName && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2.5 mb-6 flex items-center justify-between gap-3 max-w-4xl mx-auto">
            <div className="flex items-center gap-2 text-sm text-primary">
              <FolderOpen className="h-4 w-4 shrink-0" />
              <span>Je beheert het dashboard van <strong>{viewAsName}</strong>. Nieuwe analyses worden onder dit account opgeslagen.</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs border-primary/30 text-primary hover:bg-primary/10 shrink-0"
              onClick={() => navigate(`/dashboard?viewAs=${viewAsUserId}`)}
            >
              Terug
            </Button>
          </div>
        )}
        <div className="mb-16">
          <Tabs defaultValue="single" className="w-full max-w-4xl mx-auto">
            <TabsList className="grid w-full grid-cols-2 mb-8 h-auto">
              <TabsTrigger value="single" className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5">
                <FileText className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span>Enkele pagina</span>
              </TabsTrigger>
              <TabsTrigger 
                value="website" 
                className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm py-2.5"
                disabled={userPlan === 'free'}
                title={userPlan === 'free' ? 'Upgrade naar Scale of Enterprise voor volledige website-analyse' : ''}
              >
                <Globe className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
                <span className="hidden sm:inline">Volledige website</span>
                <span className="sm:hidden">Website</span>
                {userPlan === 'free' && (
                  <Badge 
                    variant="secondary" 
                    className="ml-0.5 sm:ml-1 text-[9px] sm:text-[10px] px-1 sm:px-1.5 py-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/#pricing');
                      window.location.href = '/#pricing';
                    }}
                  >
                    Upgrade
                  </Badge>
                )}
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
                    maxPages={userPlan === 'enterprise' ? 500 : 100}
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
          <div id="analysis-results" className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-8">
            <AnalysisResults 
              data={analysisData} 
              onReset={handleReset}
              onFaqsUpdate={handleFaqsUpdate}
              onGenerateFaqs={generateFaqs}
              isGeneratingFaqs={isGeneratingFaqs}
              userPlan={userPlan}
              userId={user?.id}
            />
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
