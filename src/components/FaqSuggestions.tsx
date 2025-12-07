import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Sparkles, Loader2, RefreshCw, Cpu, Cloud } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeRelevanceInBrowser, checkBrowserAiSupport, BrowserAnalysisResult } from "@/lib/browserAiRelevance";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSuggestionsProps {
  faqs: FaqItem[];
  websiteUrl?: string;
  pageContent?: string;
  onFaqsUpdate?: (updatedFaqs: FaqItem[]) => void;
}

interface AnalysisResult {
  score: number;
  explanation: string;
  category: "high" | "medium" | "low";
  source?: "cloud" | "browser";
}

export const FaqSuggestions = ({ faqs, websiteUrl = "", pageContent = "", onFaqsUpdate }: FaqSuggestionsProps) => {
  const [analysisResults, setAnalysisResults] = useState<Map<number, AnalysisResult>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [browserAiAvailable, setBrowserAiAvailable] = useState<boolean | null>(null);
  const [useBrowserAi, setUseBrowserAi] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);

  useEffect(() => {
    // Check if browser supports WebGPU for local AI
    checkBrowserAiSupport().then(supported => {
      setBrowserAiAvailable(supported);
      console.log('Browser AI (WebGPU) supported:', supported);
    });
  }, []);
  const generateJsonLd = () => {
    return {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} gekopieerd naar klembord`);
  };

  const downloadJson = () => {
    const jsonLd = generateJsonLd();
    const blob = new Blob([JSON.stringify(jsonLd, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'faq-schema.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('FAQ Schema gedownload');
  };

  const analyzeWithCloudAi = async (faq: FaqItem, index: number): Promise<AnalysisResult | null> => {
    const { data, error } = await supabase.functions.invoke('analyze-faq-relevance', {
      body: {
        question: faq.question,
        websiteUrl,
        pageContent
      }
    });

    if (error) {
      console.error(`Cloud AI error for FAQ ${index}:`, error);
      return null;
    }

    return data ? { ...data, source: "cloud" as const } : null;
  };

  const analyzeWithBrowserAi = async (faq: FaqItem): Promise<AnalysisResult> => {
    const result = await analyzeRelevanceInBrowser(faq.question, pageContent);
    return { ...result, source: "browser" as const };
  };

  const analyzeRelevance = async () => {
    if (!websiteUrl || !pageContent) {
      toast.error('Website URL en content zijn vereist voor analyse');
      return;
    }

    setIsAnalyzing(true);
    
    if (useBrowserAi) {
      setIsLoadingModel(true);
      toast.info('Browser AI model wordt geladen... Dit kan even duren bij eerste gebruik.');
    }

    const results = new Map<number, AnalysisResult>();

    try {
      for (let i = 0; i < faqs.length; i++) {
        const faq = faqs[i];
        let result: AnalysisResult | null = null;

        if (useBrowserAi && browserAiAvailable) {
          // Use browser-based AI
          try {
            result = await analyzeWithBrowserAi(faq);
            setIsLoadingModel(false);
          } catch (browserError) {
            console.error('Browser AI failed, falling back to cloud:', browserError);
            toast.error('Browser AI faalde, probeer Cloud AI');
            result = await analyzeWithCloudAi(faq, i);
          }
        } else {
          // Use cloud AI (Lovable AI / Gemini) with browser fallback
          result = await analyzeWithCloudAi(faq, i);
          
          // If cloud fails and browser AI is available, use it as fallback
          if (!result && browserAiAvailable) {
            console.log('Cloud AI failed, trying browser fallback...');
            try {
              result = await analyzeWithBrowserAi(faq);
              toast.info('Cloud AI niet beschikbaar, browser AI gebruikt als fallback');
            } catch (fallbackError) {
              console.error('Browser fallback also failed:', fallbackError);
            }
          }
        }

        if (result) {
          results.set(i, result);
        }

        setAnalysisResults(new Map(results));
        
        // Small delay between requests (less needed for browser AI)
        if (i < faqs.length - 1) {
          await new Promise(resolve => setTimeout(resolve, useBrowserAi ? 100 : 1000));
        }
      }

      const source = useBrowserAi ? 'Browser AI' : 'Cloud AI';
      toast.success(`AI Search Readiness analyse voltooid via ${source}!`);
    } catch (error) {
      console.error('Error during analysis:', error);
      toast.error('Er ging iets mis tijdens de analyse');
    } finally {
      setIsAnalyzing(false);
      setIsLoadingModel(false);
    }
  };

  const getScoreBadge = (analysis: AnalysisResult) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      high: "default",
      medium: "secondary",
      low: "destructive"
    };

    const labels = {
      high: "Hoog relevant",
      medium: "Gemiddeld relevant",
      low: "Laag relevant"
    };

    return (
      <Badge variant={variants[analysis.category]} className="ml-2">
        {labels[analysis.category]} ({analysis.score})
      </Badge>
    );
  };

  const regenerateFaq = async (index: number) => {
    if (!websiteUrl || !pageContent) {
      toast.error('Website URL en content zijn vereist voor regeneratie');
      return;
    }

    const analysis = analysisResults.get(index);
    if (!analysis) {
      toast.error('Voer eerst een AI Search Readiness analyse uit');
      return;
    }

    setRegeneratingIndex(index);
    try {
      const { data, error } = await supabase.functions.invoke('regenerate-faq', {
        body: {
          html: pageContent,
          previousQuestion: faqs[index].question,
          analysisExplanation: analysis.explanation
        }
      });

      if (error) throw error;

      if (data && onFaqsUpdate) {
        const updatedFaqs = [...faqs];
        updatedFaqs[index] = data;
        onFaqsUpdate(updatedFaqs);
        
        // Clear analysis result for this FAQ so it can be re-analyzed
        const newResults = new Map(analysisResults);
        newResults.delete(index);
        setAnalysisResults(newResults);
        
        toast.success('Vraag geregenereerd! Voer opnieuw een analyse uit om de nieuwe score te zien.');
      }
    } catch (error) {
      console.error('Error regenerating FAQ:', error);
      toast.error('Fout bij het regenereren van de vraag');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-semibold mb-2">FAQ Suggesties</h3>
            <p className="text-sm text-muted-foreground">
              Algemene vragen die bezoekers aan AI-assistenten stellen tijdens hun oriëntatiefase
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              onClick={analyzeRelevance}
              disabled={isAnalyzing || !websiteUrl}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLoadingModel ? 'Model laden...' : 'Analyseren...'}
                </>
              ) : (
                <>
                  {useBrowserAi ? <Cpu className="w-4 h-4 mr-2" /> : <Cloud className="w-4 h-4 mr-2" />}
                  AI Search Readiness
                </>
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(JSON.stringify(generateJsonLd(), null, 2), 'JSON-LD Schema')}
            >
              <Copy className="w-4 h-4 mr-2" />
              Kopieer Schema
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadJson}
            >
              <Download className="w-4 h-4 mr-2" />
              Download
            </Button>
          </div>
        </div>
        
        {/* AI Mode Toggle */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <span className="text-sm font-medium">Analyse methode:</span>
          <div className="flex gap-2">
            <Button
              variant={!useBrowserAi ? "default" : "outline"}
              size="sm"
              onClick={() => setUseBrowserAi(false)}
              disabled={isAnalyzing}
            >
              <Cloud className="w-3 h-3 mr-2" />
              Cloud AI (Gemini)
            </Button>
            <Button
              variant={useBrowserAi ? "default" : "outline"}
              size="sm"
              onClick={() => setUseBrowserAi(true)}
              disabled={isAnalyzing || !browserAiAvailable}
              title={browserAiAvailable === false ? "Je browser ondersteunt geen WebGPU" : undefined}
            >
              <Cpu className="w-3 h-3 mr-2" />
              Browser AI (Lokaal)
            </Button>
          </div>
          {browserAiAvailable === false && (
            <span className="text-xs text-muted-foreground">(WebGPU niet ondersteund)</span>
          )}
          {useBrowserAi && browserAiAvailable && (
            <span className="text-xs text-muted-foreground">(Gratis, draait lokaal in je browser)</span>
          )}
        </div>
      </div>

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => {
          const analysis = analysisResults.get(index);
          
          return (
            <AccordionItem key={index} value={`faq-${index}`}>
              <AccordionTrigger className="text-left">
                <div className="flex items-center flex-wrap gap-2">
                  <span className="font-medium">{faq.question}</span>
                  {analysis && getScoreBadge(analysis)}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                {analysis && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">AI Search Readiness Analyse:</p>
                        <p className="text-sm text-muted-foreground">{analysis.explanation}</p>
                      </div>
                      {analysis.score < 50 && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateFaq(index)}
                          disabled={regeneratingIndex === index}
                        >
                          {regeneratingIndex === index ? (
                            <>
                              <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                              Bezig...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-3 h-3 mr-2" />
                              Regenereer
                            </>
                          )}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
                <p className="text-muted-foreground">{faq.answer}</p>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(faq.question, 'Vraag')}
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Kopieer vraag
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyToClipboard(faq.answer, 'Antwoord')}
                  >
                    <Copy className="w-3 h-3 mr-2" />
                    Kopieer antwoord
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>

      <div className="mt-6 p-4 bg-muted/50 rounded-lg">
        <h4 className="font-medium mb-2 text-sm">JSON-LD Schema Preview</h4>
        <pre className="text-xs overflow-x-auto p-3 bg-background rounded border">
          {JSON.stringify(generateJsonLd(), null, 2)}
        </pre>
      </div>
    </Card>
  );
};
