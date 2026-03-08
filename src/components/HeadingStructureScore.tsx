import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface HeadingInfo {
  level: number;
  text: string;
  position: { top: number; left: number };
}

interface StructuredDataItem {
  type: string;
  data: any;
}

interface HeadingStructureScoreProps {
  headings: HeadingInfo[];
  meta?: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  structuredData?: StructuredDataItem[];
}

interface Issue {
  type: "error" | "warning" | "success";
  message: string;
  category?: "heading" | "meta" | "structured";
}

export const HeadingStructureScore = ({ headings, meta, structuredData }: HeadingStructureScoreProps) => {
  const analyzeStructure = () => {
    const issues: Issue[] = [];
    let score = 100;

    // ===== HEADING ANALYSIS (40 points max) =====
    const counts = headings.reduce((acc, h) => {
      acc[h.level] = (acc[h.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Check H1 (15 points)
    const h1Count = counts[1] || 0;
    if (h1Count === 0) {
      issues.push({ type: "error", message: "Geen H1 gevonden - essentieel voor SEO", category: "heading" });
      score -= 15;
    } else if (h1Count > 1) {
      issues.push({ type: "error", message: `${h1Count} H1 tags gevonden - gebruik er maar 1`, category: "heading" });
      score -= 10;
    } else {
      issues.push({ type: "success", message: "Perfect: 1 H1 tag gevonden", category: "heading" });
    }

    // Check hierarchy (10 points)
    const usedLevels = Object.keys(counts).map(Number).sort();
    let previousLevel = 0;
    let hierarchyIssues = 0;
    for (const level of usedLevels) {
      if (previousLevel > 0 && level > previousLevel + 1) {
        issues.push({ 
          type: "warning", 
          message: `Heading level overgeslagen: H${previousLevel} → H${level}`,
          category: "heading"
        });
        hierarchyIssues++;
      }
      previousLevel = level;
    }
    score -= Math.min(hierarchyIssues * 5, 10);

    // Check total number of headings (10 points)
    const totalHeadings = headings.length;
    if (totalHeadings === 0) {
      issues.push({ type: "error", message: "Geen headings gevonden", category: "heading" });
      score -= 10;
    } else if (totalHeadings < 3) {
      issues.push({ type: "warning", message: "Te weinig headings - voeg meer structuur toe", category: "heading" });
      score -= 5;
    } else {
      issues.push({ type: "success", message: `Goed aantal headings: ${totalHeadings}`, category: "heading" });
    }

    // Check H2 usage (5 points)
    const h2Count = counts[2] || 0;
    if (h2Count === 0 && totalHeadings > 1) {
      issues.push({ type: "warning", message: "Geen H2 tags - voeg subkoppen toe", category: "heading" });
      score -= 5;
    } else if (h2Count > 0) {
      issues.push({ type: "success", message: `${h2Count} H2 tags voor goede structuur`, category: "heading" });
    }

    // ===== META ANALYSIS (30 points max) =====
    if (meta) {
      // Title tag (15 points)
      if (!meta.title) {
        issues.push({ type: "error", message: "Geen title tag gevonden - cruciaal voor SEO", category: "meta" });
        score -= 15;
      } else if (meta.title.length > 60) {
        issues.push({ type: "warning", message: `Title tag te lang: ${meta.title.length} karakters (max 60)`, category: "meta" });
        score -= 5;
      } else {
        issues.push({ type: "success", message: "Title tag aanwezig en juiste lengte", category: "meta" });
      }

      // Meta description (15 points)
      if (!meta.description) {
        issues.push({ type: "error", message: "Geen meta description - belangrijk voor click-through rate", category: "meta" });
        score -= 15;
      } else if (meta.description.length > 160) {
        issues.push({ type: "warning", message: `Meta description te lang: ${meta.description.length} karakters (max 160)`, category: "meta" });
        score -= 5;
      } else {
        issues.push({ type: "success", message: "Meta description aanwezig en juiste lengte", category: "meta" });
      }
    } else {
      // No meta info provided - deduct points
      issues.push({ type: "warning", message: "Meta informatie kon niet worden geanalyseerd", category: "meta" });
      score -= 15;
    }

    // ===== STRUCTURED DATA ANALYSIS (30 points max) =====
    const hasStructuredData = structuredData && structuredData.length > 0;
    
    if (!hasStructuredData) {
      issues.push({ 
        type: "error", 
        message: "Geen structured data (JSON-LD) gevonden - gemiste SEO-kans voor rich snippets", 
        category: "structured" 
      });
      score -= 30;
    } else {
      // Check for important schema types
      const types = structuredData.map(s => s.type.toLowerCase());
      const hasOrganization = types.some(t => t.includes('organization'));
      const hasWebsite = types.some(t => t.includes('website'));
      const hasBreadcrumb = types.some(t => t.includes('breadcrumb'));
      
      issues.push({ 
        type: "success", 
        message: `Structured data gevonden: ${structuredData.length} ${structuredData.length === 1 ? 'type' : 'types'}`, 
        category: "structured" 
      });

      // Bonus checks for common schemas
      if (!hasWebsite) {
        issues.push({ type: "warning", message: "WebSite schema ontbreekt - aanbevolen voor sitelinks", category: "structured" });
        score -= 5;
      }
      if (!hasBreadcrumb) {
        issues.push({ type: "warning", message: "BreadcrumbList schema ontbreekt - verbetert navigatie in zoekresultaten", category: "structured" });
        score -= 5;
      }
    }

    return {
      score: Math.max(0, Math.min(100, score)),
      issues,
      counts
    };
  };

  const { score, issues } = analyzeStructure();

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreLabel = (score: number) => {
    if (score >= 80) return "Uitstekend";
    if (score >= 60) return "Goed";
    if (score >= 40) return "Matig";
    return "Slecht";
  };

  const getIcon = (type: Issue["type"]) => {
    switch (type) {
      case "error":
        return <XCircle className="h-5 w-5 text-red-500 shrink-0" />;
      case "warning":
        return <AlertCircle className="h-5 w-5 text-yellow-500 shrink-0" />;
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500 shrink-0" />;
    }
  };

  const getCategoryLabel = (category?: string) => {
    switch (category) {
      case "heading": return "Headings";
      case "meta": return "Meta";
      case "structured": return "Structured Data";
      default: return null;
    }
  };

  // Group issues by category for better readability
  const headingIssues = issues.filter(i => i.category === "heading");
  const metaIssues = issues.filter(i => i.category === "meta");
  const structuredIssues = issues.filter(i => i.category === "structured");

  return (
    <Card className="p-4 sm:p-6 shadow-elegant border-2 border-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Paginastructuur score
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Analyse van headings, meta tags en structured data
          </p>
        </div>
        <div className="flex sm:flex-col items-center sm:items-center gap-3 sm:gap-0 sm:text-center">
          <div className={`text-4xl sm:text-5xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <Badge 
            variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}
            className="sm:mt-2"
          >
            {getScoreLabel(score)}
          </Badge>
        </div>
      </div>

      <Progress value={score} className="h-3 mb-6" />

      <div className="space-y-6">
        {/* Heading Issues */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            📑 Heading Structuur
          </h4>
          {headingIssues.map((issue, idx) => (
            <div 
              key={`heading-${idx}`}
              className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
            >
              {getIcon(issue.type)}
              <p className="text-sm flex-1">{issue.message}</p>
            </div>
          ))}
        </div>

        {/* Meta Issues */}
        {metaIssues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              📝 Meta Tags
            </h4>
            {metaIssues.map((issue, idx) => (
              <div 
                key={`meta-${idx}`}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                {getIcon(issue.type)}
                <p className="text-sm flex-1">{issue.message}</p>
              </div>
            ))}
          </div>
        )}

        {/* Structured Data Issues */}
        {structuredIssues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              🔗 Structured Data
            </h4>
            {structuredIssues.map((issue, idx) => (
              <div 
                key={`structured-${idx}`}
                className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
              >
                {getIcon(issue.type)}
                <p className="text-sm flex-1">{issue.message}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
        <h4 className="text-sm font-semibold mb-2">💡 SEO Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Gebruik precies 1 H1 met je belangrijkste keyword</li>
          <li>• Bouw een logische hiërarchie: H1 → H2 → H3</li>
          <li>• Zorg voor een title tag van max 60 karakters</li>
          <li>• Voeg structured data (JSON-LD) toe voor rich snippets</li>
        </ul>
      </div>
    </Card>
  );
};
