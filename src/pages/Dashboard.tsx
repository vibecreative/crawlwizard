import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { 
  Plus, 
  Globe, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  LogOut,
  ExternalLink,
  RefreshCw,
  Trash2
} from "lucide-react";

interface ProjectPage {
  id: string;
  url: string;
  title: string | null;
  seo_score: number | null;
  has_h1: boolean;
  has_meta_description: boolean;
  has_structured_data: boolean;
  heading_issues: number;
  status: string;
}

interface Project {
  id: string;
  name: string;
  base_url: string;
  total_pages: number;
  analyzed_pages: number;
  status: string;
  created_at: string;
  updated_at: string;
  pages?: ProjectPage[];
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedProject, setExpandedProject] = useState<string | null>(null);
  const [loadingPages, setLoadingPages] = useState<string | null>(null);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const { data, error } = await supabase
        .from("projects")
        .select("*")
        .order("updated_at", { ascending: false });

      if (error) throw error;
      setProjects(data || []);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast.error("Kon projecten niet laden");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchProjectPages = async (projectId: string) => {
    setLoadingPages(projectId);
    try {
      const { data, error } = await supabase
        .from("project_pages")
        .select("*")
        .eq("project_id", projectId)
        .order("seo_score", { ascending: true });

      if (error) throw error;

      setProjects(prev => prev.map(p => 
        p.id === projectId ? { ...p, pages: data || [] } : p
      ));
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Kon pagina's niet laden");
    } finally {
      setLoadingPages(null);
    }
  };

  const handleExpandProject = (projectId: string) => {
    if (expandedProject === projectId) {
      setExpandedProject(null);
    } else {
      setExpandedProject(projectId);
      const project = projects.find(p => p.id === projectId);
      if (!project?.pages) {
        fetchProjectPages(projectId);
      }
    }
  };

  const handleDeleteProject = async (projectId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!confirm("Weet je zeker dat je dit project wilt verwijderen?")) return;

    try {
      const { error } = await supabase
        .from("projects")
        .delete()
        .eq("id", projectId);

      if (error) throw error;

      setProjects(prev => prev.filter(p => p.id !== projectId));
      toast.success("Project verwijderd");
    } catch (error) {
      console.error("Error deleting project:", error);
      toast.error("Kon project niet verwijderen");
    }
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score >= 80) return "text-emerald-500";
    if (score >= 60) return "text-amber-500";
    return "text-destructive";
  };

  const getScoreBg = (score: number | null) => {
    if (score === null) return "bg-muted";
    if (score >= 80) return "bg-emerald-500/10";
    if (score >= 60) return "bg-amber-500/10";
    return "bg-destructive/10";
  };

  const getAverageScore = (project: Project) => {
    if (!project.pages || project.pages.length === 0) return null;
    const scores = project.pages.filter(p => p.seo_score !== null).map(p => p.seo_score!);
    if (scores.length === 0) return null;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const getIssuesCount = (project: Project) => {
    if (!project.pages) return 0;
    return project.pages.reduce((acc, page) => {
      let issues = page.heading_issues || 0;
      if (!page.has_h1) issues++;
      if (!page.has_meta_description) issues++;
      if (!page.has_structured_data) issues++;
      return acc + issues;
    }, 0);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
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
            <Button variant="ghost" size="icon" onClick={handleSignOut}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <Globe className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Totaal Projecten</p>
                  <p className="text-2xl font-bold">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-emerald-500/10">
                  <FileText className="h-6 w-6 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Geanalyseerde Pagina's</p>
                  <p className="text-2xl font-bold">
                    {projects.reduce((acc, p) => acc + (p.analyzed_pages || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-amber-500/10">
                  <TrendingUp className="h-6 w-6 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Gem. SEO Score</p>
                  <p className="text-2xl font-bold">
                    {projects.length > 0 
                      ? Math.round(projects.reduce((acc, p) => {
                          const score = getAverageScore(p);
                          return acc + (score || 0);
                        }, 0) / projects.filter(p => getAverageScore(p) !== null).length) || "-"
                      : "-"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold">Mijn Projecten</h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchProjects}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Vernieuwen
            </Button>
            <Button size="sm" onClick={() => navigate("/")}>
              <Plus className="h-4 w-4 mr-2" />
              Nieuwe Analyse
            </Button>
          </div>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <Card>
            <CardContent className="pt-12 pb-12 text-center">
              <Globe className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Geen projecten gevonden</h3>
              <p className="text-muted-foreground mb-6">
                Start je eerste website analyse om projecten aan te maken.
              </p>
              <Button onClick={() => navigate("/")}>
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Analyse Starten
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {projects.map(project => {
              const avgScore = getAverageScore(project);
              const issuesCount = getIssuesCount(project);
              const isExpanded = expandedProject === project.id;

              return (
                <Card 
                  key={project.id} 
                  className="cursor-pointer transition-all hover:border-primary/50"
                  onClick={() => handleExpandProject(project.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-base">{project.name}</CardTitle>
                          <Badge variant="outline" className="text-xs">
                            {project.status === "completed" ? "Voltooid" : 
                             project.status === "analyzing" ? "Bezig..." : "In wachtrij"}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-2">
                          <Globe className="h-3 w-3" />
                          {project.base_url}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-center px-3 py-1 rounded-lg ${getScoreBg(avgScore)}`}>
                          <span className={`text-lg font-bold ${getScoreColor(avgScore)}`}>
                            {avgScore ?? "-"}
                          </span>
                          <p className="text-[10px] text-muted-foreground">Score</p>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <FileText className="h-4 w-4" />
                        {project.analyzed_pages}/{project.total_pages} pagina's
                      </span>
                      {issuesCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-500">
                          <AlertTriangle className="h-4 w-4" />
                          {issuesCount} problemen
                        </span>
                      )}
                      {issuesCount === 0 && project.pages && project.pages.length > 0 && (
                        <span className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="h-4 w-4" />
                          Geen problemen
                        </span>
                      )}
                    </div>

                    {project.total_pages > 0 && (
                      <Progress 
                        value={(project.analyzed_pages / project.total_pages) * 100} 
                        className="h-1.5 mb-3"
                      />
                    )}

                    {/* Expanded Pages View */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border" onClick={e => e.stopPropagation()}>
                        <h4 className="text-sm font-medium mb-3">Pagina Overzicht</h4>
                        
                        {loadingPages === project.id ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                              <Skeleton key={i} className="h-12 w-full" />
                            ))}
                          </div>
                        ) : project.pages && project.pages.length > 0 ? (
                          <div className="space-y-2 max-h-96 overflow-y-auto">
                            {project.pages.map(page => (
                              <div 
                                key={page.id}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div className="flex-1 min-w-0 mr-4">
                                  <p className="text-sm font-medium truncate">
                                    {page.title || new URL(page.url).pathname || "/"}
                                  </p>
                                  <p className="text-xs text-muted-foreground truncate">
                                    {page.url}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  {/* SEO Checks */}
                                  <div className="hidden sm:flex items-center gap-2">
                                    <Badge 
                                      variant={page.has_h1 ? "default" : "destructive"}
                                      className="text-xs"
                                    >
                                      H1
                                    </Badge>
                                    <Badge 
                                      variant={page.has_meta_description ? "default" : "destructive"}
                                      className="text-xs"
                                    >
                                      Meta
                                    </Badge>
                                    <Badge 
                                      variant={page.has_structured_data ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      Schema
                                    </Badge>
                                  </div>
                                  {/* Score */}
                                  <div className={`w-10 text-center py-1 rounded ${getScoreBg(page.seo_score)}`}>
                                    <span className={`text-sm font-bold ${getScoreColor(page.seo_score)}`}>
                                      {page.seo_score ?? "-"}
                                    </span>
                                  </div>
                                  {/* External Link */}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => window.open(page.url, "_blank")}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-4">
                            Geen pagina's geanalyseerd
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
