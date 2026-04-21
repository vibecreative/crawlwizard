import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SEOHead } from "@/components/SEOHead";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useViewAsUserId } from "@/hooks/useViewAsUserId";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AnalysisResults } from "@/components/AnalysisResults";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { ArrowLeft, Globe, AlertCircle, Sparkles, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { AnalysisData } from "@/types/analysis";
import {
  parseHeadings,
  parseMeta,
  parseStructuredData,
  calculateSeoScore,
  calculateHeadingIssues,
  fetchPageHtml,
} from "@/lib/htmlParser";

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
  const { i18n } = useTranslation();
  const { pageId } = useParams<{ pageId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const viewAsUserId = useViewAsUserId();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [brandContext, setBrandContext] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isReanalyzing, setIsReanalyzing] = useState(false);
  const [isGeneratingFaqs, setIsGeneratingFaqs] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userPlan, setUserPlan] = useState<string>("free");

  useEffect(() => {
    if (pageId) fetchPageData();
    if (user?.id) {
      supabase.from('profiles').select('plan').eq('id', user.id).single()
        .then(({ data }) => { if (data) setUserPlan(data.plan); });
    }
  }, [pageId, user?.id]);

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

      const { data: project, error: projectError } = await supabase
        .from("projects")
        .select("name, base_url")
        .eq("id", page.project_id)
        .single();

      if (!projectError && project) setProjectData(project);

      // Fetch brand knowledge
      const { data: brand } = await supabase
        .from("project_brand_knowledge")
        .select("*")
        .eq("project_id", page.project_id)
        .maybeSingle();

      if (brand) {
        const parts: string[] = [];
        if (brand.company_description) parts.push(`Bedrijf: ${brand.company_description}`);
        if (brand.tone_of_voice) parts.push(`Tone of voice: ${brand.tone_of_voice}`);
        if (brand.target_audience) parts.push(`Doelgroep: ${brand.target_audience}`);
        if (brand.usps) parts.push(`USPs: ${brand.usps}`);
        if (brand.key_messages) parts.push(`Kernboodschappen: ${brand.key_messages}`);
        if (brand.preferred_terms) parts.push(`Gebruik deze termen: ${brand.preferred_terms}`);
        if (brand.avoided_terms) parts.push(`Vermijd deze termen: ${brand.avoided_terms}`);
        if (brand.example_texts) parts.push(`Voorbeeldtekst (qua stijl): ${brand.example_texts.substring(0, 2000)}`);
        setBrandContext(parts.join("\n\n"));
      }
    } catch (err: any) {
      console.error("Error fetching page data:", err);
      setError(err.message || "Kon pagina niet laden");
      toast.error("Kon pagina niet laden");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => navigate("/dashboard");

  const handleReanalyze = async () => {
    if (!pageData) return;
    setIsReanalyzing(true);

    try {
      toast.info("Pagina wordt opnieuw geanalyseerd...");

      const html = await fetchPageHtml(pageData.url);
      const headings = parseHeadings(html);
      const meta = parseMeta(html);
      const structuredData = parseStructuredData(html);

      const hasH1 = headings.some(h => h.level === 1);
      const hasMetaDescription = !!meta.description;
      const hasStructuredDataFlag = structuredData.length > 0;
      const headingIssues = calculateHeadingIssues(headings);
      const seoScore = calculateSeoScore(hasH1, hasMetaDescription, hasStructuredDataFlag, headingIssues);

      const newAnalysisData: AnalysisData = {
        url: pageData.url,
        headings,
        meta,
        structuredData,
        html: '',
      };

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

      setPageData({ ...pageData, title: meta.title || null, analysis_data: newAnalysisData });
      toast.success("Pagina opnieuw geanalyseerd!");
    } catch (err: any) {
      console.error("Error reanalyzing page:", err);
      toast.error("Fout bij heranalyse: " + (err.message || "Onbekende fout"));
    } finally {
      setIsReanalyzing(false);
    }
  };

  const handleGenerateFaqs = async () => {
    if (!pageData) return;
    setIsGeneratingFaqs(true);

    try {
      let htmlContent = pageData.analysis_data?.html;

      if (!htmlContent) {
        toast.info("HTML wordt opgehaald...");
        htmlContent = await fetchWithCorsRetry(pageData.url);
        if (!htmlContent) throw new Error("Kon de pagina-inhoud niet ophalen");
      }

      toast.info("FAQs worden gegenereerd...");

      const { data, error } = await supabase.functions.invoke('generate-faqs', {
        body: { html: htmlContent, brandContext, language: i18n.language, viewAsUserId: viewAsUserId || undefined }
      });

      if (error) throw error;

      if (data?.faqs) {
        const updatedAnalysisData = { ...pageData.analysis_data, faqs: data.faqs };

        const { error: updateError } = await supabase
          .from('project_pages')
          .update({
            analysis_data: JSON.parse(JSON.stringify(updatedAnalysisData)),
            updated_at: new Date().toISOString(),
          })
          .eq('id', pageData.id);

        if (updateError) throw updateError;

        setPageData({ ...pageData, analysis_data: updatedAnalysisData });
        toast.success(`${data.faqs.length} FAQ suggesties gegenereerd!`);
      }
    } catch (err: any) {
      console.error("Error generating FAQs:", err);
      toast.error("Fout bij genereren FAQs: " + (err.message || "Onbekende fout"));
    } finally {
      setIsGeneratingFaqs(false);
    }
  };

  const handleFaqsUpdate = async (updatedFaqs: any[]) => {
    if (!pageData) return;
    try {
      const updatedAnalysisData = { ...pageData.analysis_data, faqs: updatedFaqs };

      await supabase
        .from('project_pages')
        .update({
          analysis_data: JSON.parse(JSON.stringify(updatedAnalysisData)),
          updated_at: new Date().toISOString(),
        })
        .eq('id', pageData.id);

      setPageData({ ...pageData, analysis_data: updatedAnalysisData });
    } catch (err) {
      console.error("Error updating FAQs:", err);
    }
  };

  // ── Shared header for all states ─────────────────────────────────────────

  const AppHeader = ({ showUser = false }: { showUser?: boolean }) => (
    <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-3 sm:px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 sm:gap-3">
          <Globe className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
          <h1 className="text-lg sm:text-xl font-bold">CrawlWizard</h1>
        </Link>
        <div className="flex items-center gap-2 sm:gap-4">
          {showUser && (
            <span className="text-xs text-muted-foreground hidden sm:block truncate max-w-[150px]">
              {user?.email}
            </span>
          )}
          <ThemeToggle />
        </div>
      </div>
    </header>
  );

  // ── Loading state ────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
        <main className="container mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-4" />
          <Skeleton className="h-64 w-full" />
        </main>
      </div>
    );
  }

  // ── Error state ──────────────────────────────────────────────────────────

  if (error || !pageData) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
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

  // ── No analysis data ─────────────────────────────────────────────────────

  if (!pageData.analysis_data) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader />
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

  // ── Main view ────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={pageData.title || "Pagina details"} noindex />
      <AppHeader showUser />

      <main className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <Button variant="ghost" onClick={handleBack} size="sm" className="text-xs sm:text-sm">
            <ArrowLeft className="h-4 w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Terug naar {projectData?.name || "Dashboard"}</span>
            <span className="sm:hidden">Terug</span>
          </Button>
        </div>

        <AnalysisResults 
          data={pageData.analysis_data}
          onReset={handleBack}
          onReanalyze={handleReanalyze}
          isReanalyzing={isReanalyzing}
          onFaqsUpdate={handleFaqsUpdate}
          onGenerateFaqs={handleGenerateFaqs}
          isGeneratingFaqs={isGeneratingFaqs}
          userPlan={userPlan}
          pageId={pageData.id}
          userId={user?.id}
          brandContext={brandContext}
        />
      </main>
    </div>
  );
};

export default PageDetails;
