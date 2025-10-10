import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, FileText, Hash, TrendingUp } from "lucide-react";
import { HeadingStructureScore } from "./HeadingStructureScore";

interface HeadingInfo {
  level: number;
  text: string;
  position: { top: number; left: number };
}

interface AnalysisData {
  url: string;
  screenshot?: string;
  headings: HeadingInfo[];
  meta: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  html: string;
}

interface AnalysisResultsProps {
  data: AnalysisData;
}

export const AnalysisResults = ({ data }: AnalysisResultsProps) => {
  const getHeadingColor = (level: number) => {
    const colors = {
      1: "bg-heading-h1",
      2: "bg-heading-h2", 
      3: "bg-heading-h3",
      4: "bg-heading-h4",
      5: "bg-heading-h5",
      6: "bg-heading-h6",
    };
    return colors[level as keyof typeof colors] || "bg-primary";
  };

  const headingCounts = data.headings.reduce((acc, h) => {
    acc[h.level] = (acc[h.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header with URL */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl gradient-primary">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Analyse Resultaten</h2>
            <a 
              href={data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1 mt-1"
            >
              {data.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
      </div>

      {/* Heading Structure Score - Prominent at top */}
      <HeadingStructureScore headings={data.headings} />

      {/* Visual Screenshot with Heading Markers */}
      {data.screenshot && (
        <Card className="p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Heading Structuur Visualisatie
          </h3>
          <div className="relative inline-block max-w-full">
            <img 
              src={data.screenshot} 
              alt="Website screenshot" 
              className="rounded-lg border border-border w-full"
            />
            {/* Note: In a real implementation, we would overlay heading markers on the screenshot */}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heading Structure */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Heading Structuur
          </h3>
          
          <div className="space-y-3 mb-6">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <div key={level} className="flex items-center gap-3">
                <Badge className={`${getHeadingColor(level)} text-white px-3 py-1`}>
                  H{level}
                </Badge>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getHeadingColor(level)}`}
                    style={{ width: `${(headingCounts[level] || 0) * 20}%`, maxWidth: '100%' }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">
                  {headingCounts[level] || 0}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {data.headings.map((heading, idx) => {
              // Calculate indentation based on heading level (H1 = 0, H2 = 1, etc.)
              const indentLevel = Math.max(0, heading.level - 1);
              const marginLeft = indentLevel * 24; // 24px per level
              
              return (
                <div 
                  key={idx}
                  className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors"
                  style={{ marginLeft: `${marginLeft}px` }}
                >
                  <Badge className={`${getHeadingColor(heading.level)} text-white shrink-0`}>
                    H{heading.level}
                  </Badge>
                  <p className="text-sm flex-1">{heading.text}</p>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Meta Information */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Meta Informatie
          </h3>

          <div className="space-y-4">
            {data.meta.title && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title Tag
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lengte: {data.meta.title.length} karakters {data.meta.title.length > 60 && "(⚠️ Te lang)"}
                </p>
              </div>
            )}

            {data.meta.description && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Meta Description
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lengte: {data.meta.description.length} karakters {data.meta.description.length > 160 && "(⚠️ Te lang)"}
                </p>
              </div>
            )}

            {data.meta.ogTitle && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Open Graph Title
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.ogTitle}
                </p>
              </div>
            )}

            {data.meta.ogDescription && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Open Graph Description
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.ogDescription}
                </p>
              </div>
            )}

            {data.meta.ogImage && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Open Graph Image
                </label>
                <img 
                  src={data.meta.ogImage} 
                  alt="OG Image" 
                  className="mt-2 rounded-lg border border-border max-w-full h-auto"
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Placeholder Cards for DR/UR and Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-soft bg-gradient-to-br from-card to-secondary/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Domain & URL Rating
          </h3>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              DR/UR data vereist externe API integratie
            </p>
            <p className="text-sm text-muted-foreground">
              (Ahrefs, Moz, of SEMrush)
            </p>
            <div className="mt-6 flex gap-4 justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">--</div>
                <div className="text-xs text-muted-foreground mt-1">Domain Rating</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">--</div>
                <div className="text-xs text-muted-foreground mt-1">URL Rating</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft bg-gradient-to-br from-card to-secondary/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Keyword Rankings
          </h3>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              Keyword ranking data vereist externe API integratie
            </p>
            <p className="text-sm text-muted-foreground">
              (Google Search Console, Ahrefs, of SEMrush)
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
