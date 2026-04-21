import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { calculatePageStructureScore } from "@/lib/htmlParser";

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
  const { t } = useTranslation();

  const analyzeStructure = () => {
    const issues: Issue[] = [];

    const counts = headings.reduce((acc, h) => {
      acc[h.level] = (acc[h.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    const h1Count = counts[1] || 0;
    if (h1Count === 0) {
      issues.push({ type: "error", message: t("headingScore.noH1"), category: "heading" });
      score -= 15;
    } else if (h1Count > 1) {
      issues.push({ type: "error", message: t("headingScore.multipleH1", { count: h1Count }), category: "heading" });
      score -= 10;
    } else {
      issues.push({ type: "success", message: t("headingScore.perfectH1"), category: "heading" });
    }

    const usedLevels = Object.keys(counts).map(Number).sort();
    let previousLevel = 0;
    let hierarchyIssues = 0;
    for (const level of usedLevels) {
      if (previousLevel > 0 && level > previousLevel + 1) {
        issues.push({ 
          type: "warning", 
          message: t("headingScore.levelSkipped", { from: previousLevel, to: level }),
          category: "heading"
        });
        hierarchyIssues++;
      }
      previousLevel = level;
    }
    score -= Math.min(hierarchyIssues * 5, 10);

    const totalHeadings = headings.length;
    if (totalHeadings === 0) {
      issues.push({ type: "error", message: t("headingScore.noHeadings"), category: "heading" });
      score -= 10;
    } else if (totalHeadings < 3) {
      issues.push({ type: "warning", message: t("headingScore.tooFewHeadings"), category: "heading" });
      score -= 5;
    } else {
      issues.push({ type: "success", message: t("headingScore.goodHeadingCount", { count: totalHeadings }), category: "heading" });
    }

    const h2Count = counts[2] || 0;
    if (h2Count === 0 && totalHeadings > 1) {
      issues.push({ type: "warning", message: t("headingScore.noH2"), category: "heading" });
      score -= 5;
    } else if (h2Count > 0) {
      issues.push({ type: "success", message: t("headingScore.goodH2", { count: h2Count }), category: "heading" });
    }

    if (meta) {
      if (!meta.title) {
        issues.push({ type: "error", message: t("headingScore.noTitleTag"), category: "meta" });
        score -= 15;
      } else if (meta.title.length > 60) {
        issues.push({ type: "warning", message: t("headingScore.titleTooLong", { length: meta.title.length }), category: "meta" });
        score -= 5;
      } else {
        issues.push({ type: "success", message: t("headingScore.titleGood"), category: "meta" });
      }

      if (!meta.description) {
        issues.push({ type: "error", message: t("headingScore.noMetaDesc"), category: "meta" });
        score -= 15;
      } else if (meta.description.length > 160) {
        issues.push({ type: "warning", message: t("headingScore.metaDescTooLong", { length: meta.description.length }), category: "meta" });
        score -= 5;
      } else {
        issues.push({ type: "success", message: t("headingScore.metaDescGood"), category: "meta" });
      }
    } else {
      issues.push({ type: "warning", message: t("headingScore.metaNotAnalyzed"), category: "meta" });
      score -= 15;
    }

    const hasStructuredData = structuredData && structuredData.length > 0;
    
    if (!hasStructuredData) {
      issues.push({ 
        type: "error", 
        message: t("headingScore.noStructuredData"), 
        category: "structured" 
      });
      score -= 30;
    } else {
      const types = structuredData.map(s => s.type.toLowerCase());
      const hasWebsite = types.some(t => t.includes('website'));
      const hasBreadcrumb = types.some(t => t.includes('breadcrumb'));
      
      issues.push({ 
        type: "success", 
        message: t("headingScore.structuredDataFound", { 
          count: structuredData.length, 
          type: structuredData.length === 1 ? 'type' : 'types' 
        }), 
        category: "structured" 
      });

      if (!hasWebsite) {
        issues.push({ type: "warning", message: t("headingScore.websiteSchemaMissing"), category: "structured" });
        score -= 5;
      }
      if (!hasBreadcrumb) {
        issues.push({ type: "warning", message: t("headingScore.breadcrumbMissing"), category: "structured" });
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
    if (score >= 80) return t("analysis.excellent");
    if (score >= 60) return t("analysis.good");
    if (score >= 40) return t("analysis.moderate");
    return t("analysis.poor");
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

  const headingIssues = issues.filter(i => i.category === "heading");
  const metaIssues = issues.filter(i => i.category === "meta");
  const structuredIssues = issues.filter(i => i.category === "structured");

  return (
    <Card className="p-4 sm:p-6 shadow-elegant border-2 border-primary/20">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg sm:text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t("analysis.pageStructureScore")}
          </h3>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            {t("analysis.pageStructureDesc")}
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
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            📑 {t("headingScore.headingStructureSection")}
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

        {metaIssues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              📝 {t("headingScore.metaTagsSection")}
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

        {structuredIssues.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              🔗 {t("headingScore.structuredDataSection")}
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
        <h4 className="text-sm font-semibold mb-2">💡 {t("headingScore.seoTips")}</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• {t("headingScore.tip1")}</li>
          <li>• {t("headingScore.tip2")}</li>
          <li>• {t("headingScore.tip3")}</li>
          <li>• {t("headingScore.tip4")}</li>
        </ul>
      </div>
    </Card>
  );
};