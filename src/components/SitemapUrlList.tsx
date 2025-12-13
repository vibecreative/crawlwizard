import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Play, CheckSquare, Square, Loader2, ExternalLink } from "lucide-react";
import { SitemapUrl } from "@/lib/api/sitemap";

interface SitemapUrlListProps {
  baseUrl: string;
  urls: SitemapUrl[];
  onAnalyzeSelected: (urls: string[]) => void;
  isAnalyzing: boolean;
  analyzedCount: number;
}

export const SitemapUrlList = ({ 
  baseUrl, 
  urls, 
  onAnalyzeSelected, 
  isAnalyzing,
  analyzedCount 
}: SitemapUrlListProps) => {
  const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set(urls.map(u => u.loc)));

  const toggleUrl = (url: string) => {
    const newSelected = new Set(selectedUrls);
    if (newSelected.has(url)) {
      newSelected.delete(url);
    } else {
      newSelected.add(url);
    }
    setSelectedUrls(newSelected);
  };

  const toggleAll = () => {
    if (selectedUrls.size === urls.length) {
      setSelectedUrls(new Set());
    } else {
      setSelectedUrls(new Set(urls.map(u => u.loc)));
    }
  };

  const handleAnalyze = () => {
    onAnalyzeSelected(Array.from(selectedUrls));
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
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold">Gevonden pagina's</h2>
          <p className="text-sm text-muted-foreground">
            {urls.length} pagina's gevonden op {new URL(baseUrl).hostname}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleAll}
            disabled={isAnalyzing}
          >
            {selectedUrls.size === urls.length ? (
              <>
                <Square className="mr-2 h-4 w-4" />
                Deselecteer alles
              </>
            ) : (
              <>
                <CheckSquare className="mr-2 h-4 w-4" />
                Selecteer alles
              </>
            )}
          </Button>
          <Button
            onClick={handleAnalyze}
            disabled={selectedUrls.size === 0 || isAnalyzing}
            className="gradient-primary"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyseren ({analyzedCount}/{selectedUrls.size})
              </>
            ) : (
              <>
                <Play className="mr-2 h-4 w-4" />
                Analyseer {selectedUrls.size} pagina's
              </>
            )}
          </Button>
        </div>
      </div>

      <ScrollArea className="h-[400px] pr-4">
        <div className="space-y-2">
          {urls.map((urlItem) => (
            <div
              key={urlItem.loc}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${
                selectedUrls.has(urlItem.loc) 
                  ? 'bg-primary/5 border-primary/20' 
                  : 'bg-muted/30 border-border/50'
              }`}
            >
              <Checkbox
                checked={selectedUrls.has(urlItem.loc)}
                onCheckedChange={() => toggleUrl(urlItem.loc)}
                disabled={isAnalyzing}
              />
              <div className="flex-1 min-w-0">
                <p className="font-medium truncate">{getRelativePath(urlItem.loc)}</p>
                {urlItem.lastmod && (
                  <p className="text-xs text-muted-foreground">
                    Laatst gewijzigd: {new Date(urlItem.lastmod).toLocaleDateString('nl-NL')}
                  </p>
                )}
              </div>
              {urlItem.priority && (
                <Badge variant="secondary" className="text-xs">
                  Prioriteit: {urlItem.priority}
                </Badge>
              )}
              <a
                href={urlItem.loc}
                target="_blank"
                rel="noopener noreferrer"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          ))}
        </div>
      </ScrollArea>
    </Card>
  );
};
