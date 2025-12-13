import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Globe, Loader2, FileSearch, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { sitemapApi, SitemapUrl } from "@/lib/api/sitemap";

interface WebsiteAnalyzerProps {
  onUrlsDiscovered: (baseUrl: string, urls: SitemapUrl[]) => void;
  isLoading: boolean;
}

export const WebsiteAnalyzer = ({ onUrlsDiscovered, isLoading }: WebsiteAnalyzerProps) => {
  const [url, setUrl] = useState("");
  const [isDiscovering, setIsDiscovering] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error("Voer een geldige URL in");
      return;
    }

    setIsDiscovering(true);

    try {
      const normalizedUrl = url.startsWith('http') ? url : `https://${url}`;
      const result = await sitemapApi.parseSitemap(normalizedUrl);

      if (result.success && result.urls && result.urls.length > 0) {
        toast.success(`${result.totalFound} pagina's gevonden via sitemap`);
        onUrlsDiscovered(normalizedUrl, result.urls);
      } else {
        toast.error(result.error || "Geen pagina's gevonden in sitemap");
      }
    } catch (error) {
      console.error('Sitemap discovery error:', error);
      toast.error("Fout bij het ophalen van de sitemap");
    } finally {
      setIsDiscovering(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 gradient-text">
          Website SEO Analyse
        </h1>
        <p className="text-lg text-muted-foreground">
          Analyseer je volledige website via sitemap.xml
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-4">
        <div className="flex gap-3 p-2 rounded-2xl bg-card shadow-soft border border-border/50">
          <div className="relative flex-1">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com (https:// wordt automatisch toegevoegd)"
              className="h-14 px-6 text-lg border-0 bg-transparent focus-visible:ring-0"
              disabled={isLoading || isDiscovering}
            />
          </div>
          <Button 
            type="submit" 
            size="lg"
            disabled={isLoading || isDiscovering}
            className="h-14 px-8 gradient-primary hover:opacity-90 transition-opacity"
          >
            {isDiscovering ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Sitemap ophalen...
              </>
            ) : (
              <>
                <Globe className="mr-2 h-5 w-5" />
                Ontdek pagina's
              </>
            )}
          </Button>
        </div>
        
        <div className="flex items-center gap-4 text-sm text-muted-foreground justify-center">
          <div className="flex items-center gap-2">
            <FileSearch className="h-4 w-4" />
            <span>Haalt automatisch sitemap.xml op</span>
          </div>
          <ChevronRight className="h-4 w-4" />
          <span>Ontdekt alle pagina's</span>
          <ChevronRight className="h-4 w-4" />
          <span>Analyseert SEO per pagina</span>
        </div>
      </form>
    </div>
  );
};
