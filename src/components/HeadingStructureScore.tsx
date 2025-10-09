import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, CheckCircle, XCircle, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface HeadingInfo {
  level: number;
  text: string;
  position: { top: number; left: number };
}

interface HeadingStructureScoreProps {
  headings: HeadingInfo[];
}

interface Issue {
  type: "error" | "warning" | "success";
  message: string;
}

export const HeadingStructureScore = ({ headings }: HeadingStructureScoreProps) => {
  const analyzeStructure = () => {
    const issues: Issue[] = [];
    let score = 100;

    // Count headings by level
    const counts = headings.reduce((acc, h) => {
      acc[h.level] = (acc[h.level] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    // Check H1
    const h1Count = counts[1] || 0;
    if (h1Count === 0) {
      issues.push({ type: "error", message: "Geen H1 gevonden - essentieel voor SEO" });
      score -= 30;
    } else if (h1Count > 1) {
      issues.push({ type: "error", message: `${h1Count} H1 tags gevonden - gebruik er maar 1` });
      score -= 20;
    } else {
      issues.push({ type: "success", message: "Perfect: 1 H1 tag gevonden" });
    }

    // Check hierarchy (no skipped levels)
    const usedLevels = Object.keys(counts).map(Number).sort();
    let previousLevel = 0;
    for (const level of usedLevels) {
      if (previousLevel > 0 && level > previousLevel + 1) {
        issues.push({ 
          type: "warning", 
          message: `Heading level overgeslagen: H${previousLevel} → H${level}` 
        });
        score -= 10;
      }
      previousLevel = level;
    }

    // Check total number of headings
    const totalHeadings = headings.length;
    if (totalHeadings === 0) {
      issues.push({ type: "error", message: "Geen headings gevonden" });
      score -= 40;
    } else if (totalHeadings < 3) {
      issues.push({ type: "warning", message: "Te weinig headings - voeg meer structuur toe" });
      score -= 15;
    } else if (totalHeadings > 50) {
      issues.push({ type: "warning", message: "Veel headings - zorg voor goede hiërarchie" });
      score -= 5;
    } else {
      issues.push({ type: "success", message: `Goed aantal headings: ${totalHeadings}` });
    }

    // Check H2 usage
    const h2Count = counts[2] || 0;
    if (h2Count === 0 && totalHeadings > 1) {
      issues.push({ type: "warning", message: "Geen H2 tags - voeg subkoppen toe" });
      score -= 10;
    } else if (h2Count > 0) {
      issues.push({ type: "success", message: `${h2Count} H2 tags voor goede structuur` });
    }

    // Check balance
    const deepLevels = (counts[5] || 0) + (counts[6] || 0);
    if (deepLevels > totalHeadings * 0.3) {
      issues.push({ type: "warning", message: "Veel diepe headings (H5/H6) - vereenvoudig structuur" });
      score -= 5;
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

  return (
    <Card className="p-6 shadow-elegant border-2 border-primary/20">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Heading Structuur Score
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Analyse van de logica en SEO kwaliteit
          </p>
        </div>
        <div className="text-center">
          <div className={`text-5xl font-bold ${getScoreColor(score)}`}>
            {score}
          </div>
          <Badge 
            variant={score >= 80 ? "default" : score >= 60 ? "secondary" : "destructive"}
            className="mt-2"
          >
            {getScoreLabel(score)}
          </Badge>
        </div>
      </div>

      <Progress value={score} className="h-3 mb-6" />

      <div className="space-y-3">
        <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
          Bevindingen & Aanbevelingen
        </h4>
        {issues.map((issue, idx) => (
          <div 
            key={idx}
            className="flex items-start gap-3 p-3 rounded-lg bg-secondary/50 hover:bg-secondary/70 transition-colors"
          >
            {getIcon(issue.type)}
            <p className="text-sm flex-1">{issue.message}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 p-4 bg-primary/5 rounded-lg border border-primary/10">
        <h4 className="text-sm font-semibold mb-2">💡 SEO Tips</h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• Gebruik precies 1 H1 met je belangrijkste keyword</li>
          <li>• Bouw een logische hiërarchie: H1 → H2 → H3</li>
          <li>• Gebruik H2 voor hoofdsecties en H3 voor subsecties</li>
          <li>• Maak headings beschrijvend en relevant</li>
        </ul>
      </div>
    </Card>
  );
};
