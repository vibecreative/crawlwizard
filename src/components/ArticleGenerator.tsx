import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, RefreshCw, Loader2, X, FileText, AlertTriangle, CheckCircle, HelpCircle } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useViewAsUserId } from "@/hooks/useViewAsUserId";

interface AiDetection {
  human_score: number;
  verdict: string;
  improvements: string[];
  explanation: string;
}

interface ArticleGeneratorProps {
  question: string;
  answer: string;
  pageContent?: string;
  brandContext?: string;
  onClose: () => void;
}

export const ArticleGenerator = ({ question, answer, pageContent, brandContext, onClose }: ArticleGeneratorProps) => {
  const { t, i18n } = useTranslation();
  const viewAsUserId = useViewAsUserId();
  const [article, setArticle] = useState<string | null>(null);
  const [detection, setDetection] = useState<AiDetection | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);

  const generateArticle = async (mode: "generate" | "rewrite" = "generate") => {
    const setLoading = mode === "rewrite" ? setIsRewriting : setIsGenerating;
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-article', {
        body: {
          question, answer, pageContent, brandContext, mode,
          language: i18n.language,
          viewAsUserId: viewAsUserId || undefined,
          ...(mode === "rewrite" && { articleText: article }),
        }
      });

      if (error) throw error;
      if (data?.error) { toast.error(data.error); return; }

      setArticle(data.article);
      setDetection(data.detection);
      toast.success(mode === "rewrite" ? t('article.rewritten') : t('article.generated'));
    } catch (error) {
      console.error('Error generating article:', error);
      toast.error(t('article.generateError'));
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (article) {
      navigator.clipboard.writeText(article);
      toast.success(t('article.copiedToClipboard'));
    }
  };

  const getVerdictConfig = (verdict: string) => {
    const configs: Record<string, { variant: "default" | "secondary" | "destructive"; label: string; icon: typeof CheckCircle }> = {
      menselijk: { variant: "default", label: t('article.human'), icon: CheckCircle },
      waarschijnlijk_menselijk: { variant: "default", label: t('article.probablyHuman'), icon: CheckCircle },
      onzeker: { variant: "secondary", label: t('article.uncertain'), icon: HelpCircle },
      waarschijnlijk_ai: { variant: "destructive", label: t('article.probablyAi'), icon: AlertTriangle },
      ai_gegenereerd: { variant: "destructive", label: t('article.aiGenerated'), icon: AlertTriangle },
    };
    return configs[verdict] || configs.onzeker;
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-600 dark:text-green-400";
    if (score >= 40) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  return (
    <Card className="p-6 mt-4 border-2 border-primary/20">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h4 className="font-semibold">{t('article.title')}</h4>
          <Badge variant="outline" className="text-xs">Enterprise</Badge>
        </div>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="mb-4 p-3 bg-muted/50 rounded-lg">
        <p className="text-sm text-muted-foreground">
          <strong>{t('article.basedOn')}</strong> {question}
        </p>
      </div>

      {!article && (
        <div className="text-center py-6">
          <p className="text-sm text-muted-foreground mb-4">
            {t('article.description')}
          </p>
          <Button onClick={() => generateArticle("generate")} disabled={isGenerating}>
            {isGenerating ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />{t('article.generating')}</>
            ) : (
              <><FileText className="w-4 h-4 mr-2" />{t('article.generate')}</>
            )}
          </Button>
        </div>
      )}

      {article && (
        <>
          {detection && (
            <div className="mb-4 p-4 rounded-lg border bg-card">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-medium text-sm">{t('article.humanScore')}</h5>
                {(() => {
                  const config = getVerdictConfig(detection.verdict);
                  const Icon = config.icon;
                  return (
                    <Badge variant={config.variant} className="gap-1">
                      <Icon className="h-3 w-3" />{config.label}
                    </Badge>
                  );
                })()}
              </div>
              
              <div className="flex items-center gap-3 mb-3">
                <div className="flex-1 h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      detection.human_score >= 70 ? 'bg-green-500' :
                      detection.human_score >= 40 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${detection.human_score}%` }}
                  />
                </div>
                <span className={`font-bold text-lg ${getScoreColor(detection.human_score)}`}>
                  {detection.human_score}/100
                </span>
              </div>

              <p className="text-sm text-muted-foreground mb-3">{detection.explanation}</p>

              {detection.improvements.length > 0 && detection.human_score < 70 && (
                <div className="mt-3">
                  <p className="text-xs font-medium mb-2">{t('article.improvements')}</p>
                  <ul className="text-xs text-muted-foreground space-y-1">
                    {detection.improvements.map((tip, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-0.5">•</span>{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="mb-4 max-h-[500px] overflow-y-auto">
            <div className="prose prose-sm dark:prose-invert max-w-none p-4 bg-muted/30 rounded-lg whitespace-pre-wrap font-mono text-xs">
              {article}
            </div>
          </div>

          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" onClick={copyToClipboard}>
              <Copy className="w-3 h-3 mr-2" />{t('article.copyArticle')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => generateArticle("rewrite")} disabled={isRewriting}>
              {isRewriting ? (
                <><Loader2 className="w-3 h-3 mr-2 animate-spin" />{t('article.rewriting')}</>
              ) : (
                <><RefreshCw className="w-3 h-3 mr-2" />{t('article.rewriteHuman')}</>
              )}
            </Button>
            <Button variant="outline" size="sm" onClick={() => generateArticle("generate")} disabled={isGenerating}>
              {isGenerating ? (
                <><Loader2 className="w-3 h-3 mr-2 animate-spin" />{t('article.regenerating')}</>
              ) : (
                <><RefreshCw className="w-3 h-3 mr-2" />{t('article.regenerate')}</>
              )}
            </Button>
          </div>
        </>
      )}
    </Card>
  );
};
