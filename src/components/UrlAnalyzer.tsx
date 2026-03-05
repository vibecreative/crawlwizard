import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UrlAnalyzerProps {
  onAnalyze: (url: string, primaryKeyword: string, secondaryKeywords: string[]) => void;
  isLoading: boolean;
}

export const UrlAnalyzer = ({ onAnalyze, isLoading }: UrlAnalyzerProps) => {
  const [url, setUrl] = useState("");
  const [primaryKeyword, setPrimaryKeyword] = useState("");
  const [secondaryKeywords, setSecondaryKeywords] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error("Voer een geldige URL in");
      return;
    }

    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      const secondaryKeywordList = secondaryKeywords
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
      onAnalyze(
        url.startsWith('http') ? url : `https://${url}`,
        primaryKeyword.trim(),
        secondaryKeywordList
      );
    } catch {
      toast.error("Ongeldige URL. Controleer het formaat.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 gradient-text">
          Structuuranalyse
        </h1>
        <p className="text-lg text-muted-foreground">
          Ontdek hoe zoekmachines én AI jouw pagina lezen, begrijpen en citeren
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative space-y-3">
        <div className="flex gap-3 p-2 rounded-2xl bg-card shadow-soft border border-border/50">
          <div className="relative flex-1">
            <Input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="example.com (https:// wordt automatisch toegevoegd)"
              className="h-14 px-6 text-lg border-0 bg-transparent focus-visible:ring-0"
              disabled={isLoading}
            />
          </div>
          <Button 
            type="submit" 
            size="lg"
            disabled={isLoading}
            className="h-14 px-8 gradient-primary hover:opacity-90 transition-opacity"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Analyseren...
              </>
            ) : (
              <>
                <Search className="mr-2 h-5 w-5" />
                Analyseer
              </>
            )}
          </Button>
        </div>
        
        <div className="rounded-2xl bg-card shadow-soft border border-border/50 p-2">
          <Input
            type="text"
            value={primaryKeyword}
            onChange={(e) => setPrimaryKeyword(e.target.value)}
            placeholder="Primaire zoekterm voor deze pagina (optioneel)"
            className="h-12 px-6 border-0 bg-transparent focus-visible:ring-0"
            disabled={isLoading}
          />
        </div>
        
        <div className="rounded-2xl bg-card shadow-soft border border-border/50 p-2">
          <Input
            type="text"
            value={secondaryKeywords}
            onChange={(e) => setSecondaryKeywords(e.target.value)}
            placeholder="Overige zoektermen voor deze pagina (optioneel, gescheiden door komma's)"
            className="h-12 px-6 border-0 bg-transparent focus-visible:ring-0"
            disabled={isLoading}
          />
        </div>
      </form>
    </div>
  );
};
