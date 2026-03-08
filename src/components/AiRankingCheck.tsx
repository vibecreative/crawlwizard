import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Bot,
  Loader2,
  CheckCircle2,
  XCircle,
  Minus,
  Plus,
  X,
  ChevronDown,
  ThumbsUp,
  ThumbsDown,
  Trophy,
  Lock,
  ArrowUpRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FaqItem {
  question: string;
  answer: string;
}

interface RankingResult {
  question: string;
  model: string;
  ai_response: string;
  is_mentioned: boolean;
  mention_position: number | null;
  sentiment: string;
}

interface AiRankingCheckProps {
  pageId: string;
  domain: string;
  faqs?: FaqItem[];
  userPlan?: string;
}

const MODEL_LABELS: Record<string, string> = {
  "google/gemini-2.5-pro": "Gemini Pro",
  "google/gemini-2.5-flash": "Gemini Flash",
  "openai/gpt-5": "GPT-5",
  "openai/gpt-5-mini": "GPT-5 Mini",
};

const MODEL_ORDER = [
  "google/gemini-2.5-pro",
  "google/gemini-2.5-flash",
  "openai/gpt-5",
  "openai/gpt-5-mini",
];

export const AiRankingCheck = ({ pageId, domain, faqs = [], userPlan = "free" }: AiRankingCheckProps) => {
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const isEnterprise = userPlan === "enterprise";
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<RankingResult[]>([]);
  const [customQuestions, setCustomQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [selectedFaqIndices, setSelectedFaqIndices] = useState<Set<number>>(
    new Set(faqs.slice(0, 5).map((_, i) => i))
  );

  if (!isEnterprise) {
    return (
      <Card className="p-6 shadow-soft border-dashed border-2 border-muted-foreground/20 bg-muted/30 relative overflow-hidden">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-muted">
              <Lock className="h-5 w-5 text-muted-foreground" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-muted-foreground">AI Ranking Check</h3>
              <p className="text-sm text-muted-foreground/70 mt-1 max-w-lg">
                Controleer of je website wordt genoemd door de belangrijkste AI-modellen. Ontdek je positie, vermelding en sentiment per model.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="shrink-0 gap-1.5 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
            onClick={() => navigate("/#pricing")}
          >
            Upgraden
            <ArrowUpRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </Card>
    );
  }

  const toggleFaq = (index: number) => {
    const next = new Set(selectedFaqIndices);
    if (next.has(index)) next.delete(index);
    else if (next.size + customQuestions.length < 5) next.add(index);
    else toast.error("Maximaal 5 vragen tegelijk");
    setSelectedFaqIndices(next);
  };

  const addCustomQuestion = () => {
    if (!newQuestion.trim()) return;
    if (selectedFaqIndices.size + customQuestions.length >= 5) {
      toast.error("Maximaal 5 vragen tegelijk");
      return;
    }
    setCustomQuestions([...customQuestions, newQuestion.trim()]);
    setNewQuestion("");
  };

  const removeCustomQuestion = (index: number) => {
    setCustomQuestions(customQuestions.filter((_, i) => i !== index));
  };

  const runCheck = async () => {
    const questions = [
      ...Array.from(selectedFaqIndices).map((i) => faqs[i].question),
      ...customQuestions,
    ];

    if (questions.length === 0) {
      toast.error("Selecteer minimaal één vraag");
      return;
    }

    setIsRunning(true);
    setResults([]);

    try {
      const { data, error } = await supabase.functions.invoke("check-ai-ranking", {
        body: { questions, domain, pageId, language: i18n.language },
      });

      if (error) throw error;

      if (data?.error === 'credits_exhausted') {
        toast.error(data.message || 'Je AI-credits zijn op voor deze maand.');
        return;
      }

      if (data?.results) {
        setResults(data.results);
        toast.success("AI Ranking Check voltooid!");
      }
    } catch (err: any) {
      console.error("AI Ranking Check error:", err);
      toast.error("Fout bij AI Ranking Check: " + (err.message || "Onbekende fout"));
    } finally {
      setIsRunning(false);
    }
  };

  const getQuestions = (): string[] => {
    if (results.length === 0) return [];
    return [...new Set(results.map((r) => r.question))];
  };

  const getResultForQuestionAndModel = (question: string, model: string) => {
    return results.find((r) => r.question === question && r.model === model);
  };

  const getSentimentIcon = (sentiment: string) => {
    if (sentiment === "positive") return <ThumbsUp className="h-3 w-3 text-green-500" />;
    if (sentiment === "negative") return <ThumbsDown className="h-3 w-3 text-red-500" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const getMentionSummary = () => {
    if (results.length === 0) return null;
    const mentioned = results.filter((r) => r.is_mentioned).length;
    const total = results.length;
    const pct = Math.round((mentioned / total) * 100);
    return { mentioned, total, pct };
  };

  const summary = getMentionSummary();

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg bg-primary/10">
          <Bot className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h3 className="text-xl font-semibold">AI Ranking Check</h3>
          <p className="text-sm text-muted-foreground">
            Controleer of <span className="font-medium text-foreground">{domain}</span> wordt genoemd door AI-modellen
          </p>
        </div>
      </div>

      {/* Question Selection */}
      {results.length === 0 && (
        <div className="space-y-4 mb-6">
          {/* FAQ selection */}
          {faqs.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-2">Selecteer FAQ vragen (max 5 totaal):</p>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {faqs.map((faq, i) => (
                  <label
                    key={i}
                    className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors text-sm ${
                      selectedFaqIndices.has(i)
                        ? "bg-primary/10 border border-primary/30"
                        : "bg-muted/30 border border-transparent hover:bg-muted/50"
                    }`}
                    onClick={() => toggleFaq(i)}
                  >
                    <div
                      className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                        selectedFaqIndices.has(i)
                          ? "bg-primary border-primary"
                          : "border-muted-foreground/30"
                      }`}
                    >
                      {selectedFaqIndices.has(i) && <CheckCircle2 className="h-3 w-3 text-primary-foreground" />}
                    </div>
                    <span className="truncate">{faq.question}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Custom questions */}
          <div>
            <p className="text-sm font-medium mb-2">Of voeg eigen vragen toe:</p>
            {customQuestions.map((q, i) => (
              <div key={i} className="flex items-center gap-2 mb-1.5">
                <span className="text-sm flex-1 p-2 bg-muted/30 rounded-lg truncate">{q}</span>
                <Button variant="ghost" size="sm" onClick={() => removeCustomQuestion(i)}>
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Input
                placeholder="Typ je eigen vraag..."
                value={newQuestion}
                onChange={(e) => setNewQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addCustomQuestion()}
                className="text-sm"
              />
              <Button variant="outline" size="sm" onClick={addCustomQuestion}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Button onClick={runCheck} disabled={isRunning} className="w-full gap-2">
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                AI-modellen bevragen... Dit kan even duren
              </>
            ) : (
              <>
                <Bot className="h-4 w-4" />
                Start AI Ranking Check
              </>
            )}
          </Button>

          <div className="rounded-lg bg-muted/40 border border-border/50 p-4 text-xs text-muted-foreground space-y-2">
            <p>
              <span className="font-semibold text-foreground">Welke modellen?</span>{" "}
              Elke vraag wordt parallel voorgelegd aan 4 AI-modellen: Gemini Pro, Gemini Flash, GPT-5 en GPT-5 Mini.
            </p>
            <p>
              <span className="font-semibold text-foreground">Wat wordt gecheckt?</span>{" "}
              Per model analyseren we of je domein wordt <em>genoemd</em>, op welke <em>positie</em> het verschijnt en wat het <em>sentiment</em> is (positief, neutraal of negatief).
            </p>
            <p>
              <span className="font-semibold text-foreground">Waarom max. 5 vragen?</span>{" "}
              Elke vraag genereert 4 AI-aanvragen (één per model). Om het creditverbruik beheersbaar te houden is het maximum 5 vragen per check (= 20 AI-calls).
            </p>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-6">
          {/* Summary */}
          {summary && (
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-primary">{summary.pct}%</p>
                <p className="text-xs text-muted-foreground">Vermeldingspercentage</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold text-green-500">{summary.mentioned}</p>
                <p className="text-xs text-muted-foreground">Vermeldingen</p>
              </div>
              <div className="text-center p-3 rounded-lg bg-muted/30">
                <p className="text-2xl font-bold">{summary.total}</p>
                <p className="text-xs text-muted-foreground">Totaal checks</p>
              </div>
            </div>
          )}

          {/* Results per question */}
          <ScrollArea className="max-h-[600px]">
            <div className="space-y-4">
              {getQuestions().map((question, qIdx) => (
                <div key={qIdx} className="border rounded-lg p-4">
                  <p className="font-medium text-sm mb-3">{question}</p>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
                    {MODEL_ORDER.map((model) => {
                      const result = getResultForQuestionAndModel(question, model);
                      if (!result) return null;

                      return (
                        <Collapsible key={model}>
                          <CollapsibleTrigger className="w-full">
                            <div
                              className={`p-3 rounded-lg border text-left transition-colors hover:bg-muted/50 group ${
                                result.is_mentioned
                                  ? "border-green-500/30 bg-green-500/5"
                                  : "border-red-500/20 bg-red-500/5"
                              }`}
                            >
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium">{MODEL_LABELS[model]}</span>
                                <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
                              </div>
                              <div className="flex items-center gap-1.5">
                                {result.is_mentioned ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-500" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-red-500" />
                                )}
                                <span className="text-xs">
                                  {result.is_mentioned
                                    ? `#${result.mention_position || "?"} genoemd`
                                    : "Niet genoemd"}
                                </span>
                              </div>
                              {result.is_mentioned && (
                                <div className="flex items-center gap-1 mt-1">
                                  {getSentimentIcon(result.sentiment)}
                                  <span className="text-xs text-muted-foreground capitalize">{result.sentiment}</span>
                                </div>
                              )}
                            </div>
                          </CollapsibleTrigger>
                          <CollapsibleContent>
                            <div className="mt-2 p-3 rounded-lg bg-muted/30 text-xs text-muted-foreground max-h-40 overflow-y-auto whitespace-pre-wrap">
                              {result.ai_response}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          {/* Run again button */}
          <Button variant="outline" onClick={() => setResults([])} className="w-full gap-2">
            <Bot className="h-4 w-4" />
            Nieuwe check uitvoeren
          </Button>
        </div>
      )}
    </Card>
  );
};
