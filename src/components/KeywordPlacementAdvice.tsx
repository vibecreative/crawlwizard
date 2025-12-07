import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Target, Link, FileText, AlignLeft } from "lucide-react";

interface KeywordPlacementAnalysis {
  keyword: string;
  inUrl: boolean;
  inH1: boolean;
  inIntroText: boolean;
  url: string;
  h1Text?: string;
  introText?: string;
}

interface KeywordPlacementAdviceProps {
  analysis: KeywordPlacementAnalysis | null;
}

export const KeywordPlacementAdvice = ({ analysis }: KeywordPlacementAdviceProps) => {
  if (!analysis) return null;

  const checkItems = [
    {
      label: "URL",
      description: "Het hoofdzoekwoord komt voor in de URL",
      icon: Link,
      passed: analysis.inUrl,
      detail: analysis.url,
      advice: analysis.inUrl
        ? "Het zoekwoord is opgenomen in de URL. Dit helpt zoekmachines begrijpen waar de pagina over gaat."
        : `Overweeg de URL aan te passen om "${analysis.keyword}" op te nemen. Een keyword-rijke URL versterkt de relevantie voor zoekmachines.`,
    },
    {
      label: "H1 Tag",
      description: "Het hoofdzoekwoord komt voor in de H1 heading",
      icon: FileText,
      passed: analysis.inH1,
      detail: analysis.h1Text,
      advice: analysis.inH1
        ? "Het zoekwoord is opgenomen in de H1. Dit is cruciaal voor SEO omdat de H1 de belangrijkste heading van de pagina is."
        : `Voeg "${analysis.keyword}" toe aan de H1 heading. Dit is een van de belangrijkste on-page SEO factoren.`,
    },
    {
      label: "Introtekst",
      description: "Het hoofdzoekwoord komt voor in de eerste alinea onder de H1",
      icon: AlignLeft,
      passed: analysis.inIntroText,
      detail: analysis.introText ? (analysis.introText.length > 150 ? analysis.introText.substring(0, 150) + "..." : analysis.introText) : undefined,
      advice: analysis.inIntroText
        ? "Het zoekwoord staat in de introtekst. Dit versterkt direct de context voor zoekmachines en gebruikers."
        : `Verwerk "${analysis.keyword}" in de eerste alinea direct onder de H1. Dit geeft zoekmachines direct context over het onderwerp.`,
    },
  ];

  const passedCount = checkItems.filter(item => item.passed).length;
  const score = Math.round((passedCount / checkItems.length) * 100);

  const getScoreColor = () => {
    if (score === 100) return "text-green-500";
    if (score >= 66) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreBadge = () => {
    if (score === 100) return "default";
    if (score >= 66) return "secondary";
    return "destructive";
  };

  return (
    <Card className="p-6">
      <div className="flex items-start gap-3 mb-6">
        <div className="p-2 rounded-lg bg-primary/10">
          <Target className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold mb-1">Keyword Plaatsing Advies</h2>
              <p className="text-sm text-muted-foreground">
                Controleer of "{analysis.keyword}" op de juiste posities staat
              </p>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${getScoreColor()}`}>{score}%</div>
              <Badge variant={getScoreBadge() as any} className="mt-1">
                {passedCount}/{checkItems.length} checks
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        {checkItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className={`p-4 rounded-lg border transition-colors ${
                item.passed
                  ? "bg-green-500/5 border-green-500/20"
                  : "bg-red-500/5 border-red-500/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    item.passed ? "bg-green-500/10" : "bg-red-500/10"
                  }`}
                >
                  <Icon
                    className={`h-5 w-5 ${
                      item.passed ? "text-green-500" : "text-red-500"
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{item.label}</h3>
                    {item.passed ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">
                    {item.description}
                  </p>
                  {item.detail && (
                    <div className="p-2 rounded bg-muted/50 text-xs font-mono mb-2 break-all">
                      {item.detail}
                    </div>
                  )}
                  <p
                    className={`text-sm ${
                      item.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    }`}
                  >
                    {item.advice}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6 p-4 rounded-lg bg-muted/50 border border-border/50">
        <h4 className="font-medium mb-2 text-sm flex items-center gap-2">
          <Target className="h-4 w-4 text-primary" />
          Waarom zijn deze posities belangrijk?
        </h4>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li>
            <strong>URL:</strong> Een keyword in de URL is een sterke relevantiesignaal voor zoekmachines en verbetert de click-through rate in zoekresultaten.
          </li>
          <li>
            <strong>H1 Tag:</strong> De H1 is de belangrijkste heading en vertelt zoekmachines direct waar de pagina over gaat. Er mag maar één H1 per pagina zijn.
          </li>
          <li>
            <strong>Introtekst:</strong> De eerste alinea wordt door zoekmachines extra zwaar gewogen. Het keyword hier plaatsen versterkt de topical relevantie.
          </li>
        </ul>
      </div>
    </Card>
  );
};
