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
    navigate("/dashboard");
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
        />
      </main>
    </div>
  );
};

export default PageDetails;
