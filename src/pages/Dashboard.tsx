import { useState, useEffect } from "react";
import { SEOHead } from "@/components/SEOHead";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Button } from "@/components/ui/button";
import { CreditsDashboard } from "@/components/CreditsDashboard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { BrandKnowledge } from "@/components/BrandKnowledge";
import { 
  Plus, 
  Globe, 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle2, 
  LogOut,
  ExternalLink,
  Trash2,
  Eye,
  Shield,
  Search
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
  analysis_data: any | null;
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
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchProjects();
    if (user?.id) {
      supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .then(({ data }) => {
          if (data && data.length > 0) setIsAdmin(true);
        });
    }
  }, [user?.id]);

  useEffect(() => {
    const fetchAllProjectPages = async () => {
      if (projects.length === 0) return;
      const projectsNeedingPages = projects.filter(p => !p.pages);
      if (projectsNeedingPages.length === 0) return;
      try {
        const { data, error } = await supabase
          .from("project_pages")
          .select("*")
          .in("project_id", projectsNeedingPages.map(p => p.id));
        if (error) throw error;
        if (data) {
          setProjects(prev => prev.map(p => {
            const projectPages = data.filter(page => page.project_id === p.id);
            return projectPages.length > 0 ? { ...p, pages: projectPages } : p;
          }));
        }
      } catch (error) {
        console.error("Error fetching all project pages:", error);
      }
    };
    fetchAllProjectPages();
  }, [projects.length]);

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
      const { error } = await supabase.from("projects").delete().eq("id", projectId);
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
    if (score >= 80) return "text-emerald-600 dark:text-emerald-400";
    if (score >= 60) return "text-amber-600 dark:text-amber-400";
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
      <SEOHead title="Dashboard" noindex />
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md gradient-primary flex items-center justify-center">
              <Search className="h-4 w-4 text-primary-foreground" />
            </div>
            <h1 className="text-lg font-bold font-display">CrawlWizard</h1>
          </Link>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground hidden sm:block">
              {user?.email}
            </span>
            {isAdmin && (
              <Button variant="outline" size="sm" onClick={() => navigate("/admin")} className="h-8 text-xs">
                <Shield className="h-3.5 w-3.5 mr-1.5" />
                Admin
              </Button>
            )}
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Globe className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Projecten</p>
                  <p className="text-2xl font-bold font-display">{projects.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <FileText className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Pagina's</p>
                  <p className="text-2xl font-bold font-display">
                    {projects.reduce((acc, p) => acc + (p.analyzed_pages || 0), 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <TrendingUp className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Gem. Score</p>
                  <p className="text-2xl font-bold font-display">
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
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-base font-semibold font-display">Mijn Projecten</h2>
          <Button size="sm" onClick={() => navigate("/analyze")} className="gradient-primary text-primary-foreground h-8 text-xs">
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Nieuwe Analyse
          </Button>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="shadow-soft border-border/50">
                <CardContent className="pt-5 pb-5">
                  <div className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
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
          <Card className="shadow-soft border-border/50">
            <CardContent className="pt-12 pb-12 text-center">
              <div className="w-14 h-14 rounded-xl bg-muted flex items-center justify-center mx-auto mb-4">
                <Globe className="h-7 w-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold font-display mb-2">Geen projecten gevonden</h3>
              <p className="text-sm text-muted-foreground mb-6">
                Start je eerste website analyse om projecten aan te maken.
              </p>
              <Button onClick={() => navigate("/analyze")} className="gradient-primary text-primary-foreground">
                <Plus className="h-4 w-4 mr-2" />
                Nieuwe Analyse Starten
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {projects.map(project => {
              const avgScore = getAverageScore(project);
              const issuesCount = getIssuesCount(project);
              const isExpanded = expandedProject === project.id;

              return (
                <Card 
                  key={project.id} 
                  className={`cursor-pointer transition-all shadow-soft border-border/50 hover:border-primary/30 ${isExpanded ? 'border-primary/30' : ''}`}
                  onClick={() => handleExpandProject(project.id)}
                >
                  <CardHeader className="pb-3 pt-5">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <CardTitle className="text-sm font-display">{project.name}</CardTitle>
                          <Badge variant="outline" className="text-[10px] h-5 px-1.5">
                            {project.status === "completed" ? "Voltooid" : 
                             project.status === "analyzing" ? "Bezig..." : "In wachtrij"}
                          </Badge>
                        </div>
                        <CardDescription className="flex items-center gap-1.5 text-xs">
                          <Globe className="h-3 w-3" />
                          {project.base_url}
                        </CardDescription>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className={`text-center px-3 py-1.5 rounded-lg ${getScoreBg(avgScore)}`}>
                          <span className={`text-lg font-bold font-display ${getScoreColor(avgScore)}`}>
                            {avgScore ?? "-"}
                          </span>
                        </div>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleDeleteProject(project.id, e)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pb-5">
                    <div className="flex items-center gap-5 text-xs text-muted-foreground mb-3">
                      <span className="flex items-center gap-1">
                        <FileText className="h-3.5 w-3.5" />
                        {project.analyzed_pages}/{project.total_pages} pagina's
                      </span>
                      {issuesCount > 0 && (
                        <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          {issuesCount} problemen
                        </span>
                      )}
                      {issuesCount === 0 && project.pages && project.pages.length > 0 && (
                        <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Geen problemen
                        </span>
                      )}
                    </div>

                    {project.total_pages > 0 && (
                      <Progress 
                        value={(project.analyzed_pages / project.total_pages) * 100} 
                        className="h-1 mb-3"
                      />
                    )}

                    {/* Expanded Pages View */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-border" onClick={e => e.stopPropagation()}>
                        <h4 className="text-xs font-semibold font-display uppercase tracking-wider text-muted-foreground mb-3">Pagina Overzicht</h4>
                        
                        {loadingPages === project.id ? (
                          <div className="space-y-2">
                            {[1, 2, 3].map(i => (
                              <Skeleton key={i} className="h-10 w-full rounded-lg" />
                            ))}
                          </div>
                        ) : project.pages && project.pages.length > 0 ? (
                          <div className="space-y-1.5 max-h-96 overflow-y-auto">
                            {project.pages.map(page => (
                              <div 
                                key={page.id}
                                className="flex items-center justify-between p-2.5 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                              >
                                <div 
                                  className="flex-1 min-w-0 mr-3 cursor-pointer hover:text-primary transition-colors"
                                  onClick={() => navigate(`/page/${page.id}`)}
                                >
                                  <p className="text-xs font-medium truncate">
                                    {page.title || new URL(page.url).pathname || "/"}
                                  </p>
                                  <p className="text-[11px] text-muted-foreground truncate">
                                    {page.url}
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <div className="hidden sm:flex items-center gap-1.5">
                                    <Badge variant={page.has_h1 ? "default" : "destructive"} className="text-[10px] h-5 px-1.5">H1</Badge>
                                    <Badge variant={page.has_meta_description ? "default" : "destructive"} className="text-[10px] h-5 px-1.5">Meta</Badge>
                                    <Badge variant={page.has_structured_data ? "default" : "secondary"} className="text-[10px] h-5 px-1.5">Schema</Badge>
                                  </div>
                                  <div className={`w-9 text-center py-0.5 rounded ${getScoreBg(page.seo_score)}`}>
                                    <span className={`text-xs font-bold ${getScoreColor(page.seo_score)}`}>
                                      {page.seo_score ?? "-"}
                                    </span>
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[10px] px-2"
                                    onClick={() => navigate(`/page/${page.id}`)}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Details
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-7 w-7"
                                    onClick={() => window.open(page.url, "_blank")}
                                  >
                                    <ExternalLink className="h-3 w-3" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-muted-foreground text-center py-4">
                            Geen pagina's geanalyseerd
                          </p>
                        )}

                        {/* Brand Knowledge Section */}
                        <div className="mt-4 pt-4 border-t border-border">
                          <BrandKnowledge projectId={project.id} />
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* AI Credits Dashboard */}
        {user?.id && (
          <div className="mt-8 mb-8">
            <h2 className="text-base font-semibold font-display mb-4">AI Credits</h2>
            <CreditsDashboard userId={user.id} />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
