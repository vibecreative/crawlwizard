import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Target, Link, FileText, AlignLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();

  if (!analysis) return null;

  const checkItems = [
    {
      label: t("keywordPlacement.urlLabel"),
      description: t("keywordPlacement.urlDescription"),
      icon: Link,
      passed: analysis.inUrl,
      detail: analysis.url,
      advice: analysis.inUrl
        ? t("keywordPlacement.urlPass")
        : t("keywordPlacement.urlFail", { keyword: analysis.keyword }),
    },
    {
      label: t("keywordPlacement.h1Label"),
      description: t("keywordPlacement.h1Description"),
      icon: FileText,
      passed: analysis.inH1,
      detail: analysis.h1Text,
      advice: analysis.inH1
        ? t("keywordPlacement.h1Pass")
        : t("keywordPlacement.h1Fail", { keyword: analysis.keyword }),
    },
    {
      label: t("keywordPlacement.introLabel"),
      description: t("keywordPlacement.introDescription"),
      icon: AlignLeft,
      passed: analysis.inIntroText,
      detail: analysis.introText ? (analysis.introText.length > 150 ? analysis.introText.substring(0, 150) + "..." : analysis.introText) : undefined,
      advice: analysis.inIntroText
        ? t("keywordPlacement.introPass")
        : t("keywordPlacement.introFail", { keyword: analysis.keyword }),
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
              <h2 className="text-xl font-semibold mb-1">{t("keywordPlacement.title")}</h2>
              <p className="text-sm text-muted-foreground">
                {t("keywordPlacement.checkPosition", { keyword: analysis.keyword })}
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
                <div className={`p-2 rounded-lg ${item.passed ? "bg-green-500/10" : "bg-red-500/10"}`}>
                  <Icon className={`h-5 w-5 ${item.passed ? "text-green-500" : "text-red-500"}`} />
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
                  <p className="text-sm text-muted-foreground mb-2">{item.description}</p>
                  {item.detail && (
                    <div className="p-2 rounded bg-muted/50 text-xs font-mono mb-2 break-all">{item.detail}</div>
                  )}
                  <p className={`text-sm ${item.passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>
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
          {t("keywordPlacement.whyImportant")}
        </h4>
        <ul className="text-xs text-muted-foreground space-y-2">
          <li><strong>{t("keywordPlacement.urlLabel")}:</strong> {t("keywordPlacement.urlImportance")}</li>
          <li><strong>{t("keywordPlacement.h1Label")}:</strong> {t("keywordPlacement.h1Importance")}</li>
          <li><strong>{t("keywordPlacement.introLabel")}:</strong> {t("keywordPlacement.introImportance")}</li>
        </ul>
      </div>
    </Card>
  );
};