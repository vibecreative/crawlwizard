import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface KeywordScore {
  keyword: string;
  density: number;
  count: number;
  relevance: number;
}

interface KeywordAnalysisProps {
  keywords: KeywordScore[];
}

export const KeywordAnalysis = ({ keywords }: KeywordAnalysisProps) => {
  if (keywords.length === 0) {
    return null;
  }

  const getDensityStatus = (density: number) => {
    if (density > 3) return { label: "Te hoog (keyword stuffing)", color: "destructive", icon: TrendingUp };
    if (density >= 1 && density <= 3) return { label: "Optimaal", color: "default", icon: Minus };
    return { label: "Te laag", color: "secondary", icon: TrendingDown };
  };

  const getRelevanceStatus = (relevance: number) => {
    if (relevance >= 70) return { label: "Hoog", color: "default" };
    if (relevance >= 40) return { label: "Gemiddeld", color: "secondary" };
    return { label: "Laag", color: "destructive" };
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <AlertCircle className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-semibold mb-1">Keyword Analyse</h2>
          <p className="text-sm text-muted-foreground">
            Analyse van keyword density en relevantie ten opzichte van de content
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {keywords.map((kw) => {
          const densityStatus = getDensityStatus(kw.density);
          const relevanceStatus = getRelevanceStatus(kw.relevance);
          const DensityIcon = densityStatus.icon;

          return (
            <div key={kw.keyword} className="p-4 rounded-lg border bg-card">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-lg mb-1">{kw.keyword}</h3>
                  <p className="text-sm text-muted-foreground">
                    Gevonden: {kw.count} keer
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Keyword Density</span>
                    <Badge variant={densityStatus.color as any} className="flex items-center gap-1">
                      <DensityIcon className="h-3 w-3" />
                      {kw.density.toFixed(2)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {densityStatus.label}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Relevantie Score</span>
                    <Badge variant={relevanceStatus.color as any}>
                      {kw.relevance.toFixed(0)}%
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {relevanceStatus.label}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/50">
        <h4 className="font-medium mb-2 text-sm">Wat betekenen deze scores?</h4>
        <ul className="text-xs text-muted-foreground space-y-1">
          <li>• <strong>Keyword Density:</strong> Percentage van het totale aantal woorden. Optimaal is tussen 1-3%.</li>
          <li>• <strong>Relevantie Score:</strong> Hoe goed het keyword past bij de context waarin het voorkomt.</li>
          <li>• <strong>Keyword Stuffing:</strong> Te hoge density (&gt;3%) kan door zoekmachines als spam worden gezien.</li>
        </ul>
      </div>
    </Card>
  );
};
