import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  ExternalLink,
  ChevronRight,
  FileText,
  Heading1,
  FileCode,
  Search
} from "lucide-react";

export interface PageAnalysisResult {
  url: string;
  title?: string;
  status: 'success' | 'error';
  errorMessage?: string;
  seoScore?: number;
  hasH1: boolean;
  hasMetaDescription: boolean;
  hasStructuredData: boolean;
  headingIssues: number;
  analysisData?: any; // Full analysis data for detailed view
}

interface WebsiteAnalysisResultsProps {
  results: PageAnalysisResult[];
  onViewDetails: (url: string) => void;
}

export const WebsiteAnalysisResults = ({ results, onViewDetails }: WebsiteAnalysisResultsProps) => {
  const successCount = results.filter(r => r.status === 'success').length;
  const errorCount = results.filter(r => r.status === 'error').length;
  const avgScore = results
    .filter(r => r.seoScore !== undefined)
    .reduce((sum, r) => sum + (r.seoScore || 0), 0) / successCount || 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (score >= 60) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  const getRelativePath = (fullUrl: string) => {
    try {
      const url = new URL(fullUrl);
      return url.pathname || '/';
    } catch {
      return fullUrl;
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pagina's geanalyseerd</p>
              <p className="text-2xl font-bold">{successCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Search className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gemiddelde SEO Score</p>
              <p className={`text-2xl font-bold ${getScoreColor(avgScore)}`}>
                {avgScore.toFixed(0)}%
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/10">
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Succesvol</p>
              <p className="text-2xl font-bold text-green-500">{successCount}</p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/10">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fouten</p>
              <p className="text-2xl font-bold text-red-500">{errorCount}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Results List */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Analyseresultaten per pagina</h2>
        
        <ScrollArea className="h-[500px] pr-4">
          <div className="space-y-3">
            {results.map((result) => (
              <div
                key={result.url}
                className={`p-4 rounded-lg border transition-colors ${
                  result.status === 'error' 
                    ? 'bg-red-500/5 border-red-500/20' 
                    : 'bg-muted/30 border-border/50 hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium truncate">
                        {result.title || getRelativePath(result.url)}
                      </p>
                      {result.status === 'error' && (
                        <Badge variant="destructive" className="text-xs">Fout</Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {getRelativePath(result.url)}
                    </p>
                    
                    {result.status === 'success' && (
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                          {result.hasH1 ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">H1</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {result.hasMetaDescription ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-xs text-muted-foreground">Meta</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          {result.hasStructuredData ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                          )}
                          <span className="text-xs text-muted-foreground">Schema</span>
                        </div>
                        
                        {result.headingIssues > 0 && (
                          <Badge variant="outline" className="text-xs border-yellow-500/50 text-yellow-600">
                            {result.headingIssues} heading issue{result.headingIssues > 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>
                    )}
                    
                    {result.status === 'error' && result.errorMessage && (
                      <p className="text-sm text-red-500 mt-1">{result.errorMessage}</p>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {result.seoScore !== undefined && (
                      <Badge className={`${getScoreBadge(result.seoScore)} border`}>
                        {result.seoScore}%
                      </Badge>
                    )}
                    
                    {result.status === 'success' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onViewDetails(result.url)}
                        className="gap-1"
                      >
                        Details
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <a
                      href={result.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </Card>
    </div>
  );
};
