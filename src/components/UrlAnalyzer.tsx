import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface UrlAnalyzerProps {
  onAnalyze: (url: string) => void;
  isLoading: boolean;
}

export const UrlAnalyzer = ({ onAnalyze, isLoading }: UrlAnalyzerProps) => {
  const [url, setUrl] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error("Voer een geldige URL in");
      return;
    }

    // Basic URL validation
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
      onAnalyze(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      toast.error("Ongeldige URL. Controleer het formaat.");
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-5xl font-bold mb-4 gradient-text">
          SEO Analyse Tool
        </h1>
        <p className="text-lg text-muted-foreground">
          Analyseer de technische SEO structuur van elke webpagina
        </p>
      </div>

      <form onSubmit={handleSubmit} className="relative">
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
      </form>
    </div>
  );
};
