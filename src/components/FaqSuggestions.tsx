import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Copy, Download, Sparkles, Loader2, RefreshCw, Cpu, Cloud, Search, FileText } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { analyzeRelevanceInBrowser, checkBrowserAiSupport, BrowserAnalysisResult } from "@/lib/browserAiRelevance";
import { ArticleGenerator } from "./ArticleGenerator";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSuggestionsProps {
  faqs: FaqItem[];
  websiteUrl?: string;
  pageContent?: string;
  onFaqsUpdate?: (updatedFaqs: FaqItem[]) => void;
  onGenerateFaqs?: () => Promise<void>;
  isGeneratingFaqs?: boolean;
  userPlan?: string;
}

interface AnalysisResult {
  score: number;
  explanation: string;
  category: "high" | "medium" | "low";
  source?: "cloud" | "browser";
}

export const FaqSuggestions = ({ 
  faqs, 
  websiteUrl = "", 
  pageContent = "", 
  onFaqsUpdate,
  onGenerateFaqs,
  isGeneratingFaqs = false,
  userPlan = "free"
}: FaqSuggestionsProps) => {
  const [analysisResults, setAnalysisResults] = useState<Map<number, AnalysisResult>>(new Map());
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzingSingleIndex, setAnalyzingSingleIndex] = useState<number | null>(null);
  const [regeneratingIndex, setRegeneratingIndex] = useState<number | null>(null);
  const [browserAiAvailable, setBrowserAiAvailable] = useState<boolean | null>(null);
  const [useBrowserAi, setUseBrowserAi] = useState(false);
  const [isLoadingModel, setIsLoadingModel] = useState(false);
  const [articleOpenIndex, setArticleOpenIndex] = useState<number | null>(null);
  const isEnterprise = userPlan === 'enterprise';

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
    if (!websiteUrl) {
      toast.error('Website URL is vereist voor analyse');
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

  const analyzeSingleFaq = async (index: number) => {
    if (!websiteUrl) {
      toast.error('Website URL is vereist voor analyse');
      return;
    }

    setAnalyzingSingleIndex(index);
    
    try {
      const faq = faqs[index];
      let result: AnalysisResult | null = null;

      if (useBrowserAi && browserAiAvailable) {
        try {
          result = await analyzeWithBrowserAi(faq);
        } catch (browserError) {
          console.error('Browser AI failed, falling back to cloud:', browserError);
          result = await analyzeWithCloudAi(faq, index);
        }
      } else {
        result = await analyzeWithCloudAi(faq, index);
        
        if (!result && browserAiAvailable) {
          try {
            result = await analyzeWithBrowserAi(faq);
          } catch (fallbackError) {
            console.error('Browser fallback also failed:', fallbackError);
          }
        }
      }

      if (result) {
        const newResults = new Map(analysisResults);
        newResults.set(index, result);
        setAnalysisResults(newResults);
        toast.success('Vraag geanalyseerd!');
      }
    } catch (error) {
      console.error('Error analyzing single FAQ:', error);
      toast.error('Fout bij analyseren van de vraag');
    } finally {
      setAnalyzingSingleIndex(null);
    }
  };

  const regenerateFaq = async (index: number) => {
    if (!websiteUrl) {
      toast.error('Website URL is vereist voor regeneratie');
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
        
        toast.success('Vraag geregenereerd! Klik op "Analyseer" om de nieuwe score te zien.');
      }
    } catch (error) {
      console.error('Error regenerating FAQ:', error);
      toast.error('Fout bij het regenereren van de vraag');
    } finally {
      setRegeneratingIndex(null);
    }
  };

  // Show generate button if no FAQs yet
  if (faqs.length === 0) {
    return (
      <Card className="p-6">
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-xl font-semibold mb-2">FAQ Suggesties</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            Genereer AI-gestuurde FAQ suggesties op basis van de pagina-inhoud. 
            Deze vragen zijn geoptimaliseerd voor AI-zoekmachines en featured snippets.
          </p>
          {onGenerateFaqs ? (
            <Button
              onClick={onGenerateFaqs}
              disabled={isGeneratingFaqs}
              className="gap-2"
            >
              {isGeneratingFaqs ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  FAQs genereren...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Genereer FAQ Suggesties
                </>
              )}
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              FAQ generatie is niet beschikbaar voor deze pagina.
            </p>
          )}
        </div>
      </Card>
    );
  }

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
              disabled={isAnalyzing || analyzingSingleIndex !== null}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {isLoadingModel ? 'Model laden...' : 'Analyseren...'}
                </>
              ) : (
                <>
                  {useBrowserAi ? <Cpu className="w-4 h-4 mr-2" /> : <Cloud className="w-4 h-4 mr-2" />}
                  Analyseer Alle
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
        <div className="flex flex-col gap-3 p-4 bg-muted/50 rounded-lg">
          <div className="flex items-center gap-3 flex-wrap">
            <span className="text-sm font-medium">Analyse methode:</span>
            <div className="flex gap-2">
              <Button
                variant={!useBrowserAi ? "default" : "outline"}
                size="sm"
                onClick={() => setUseBrowserAi(false)}
                disabled={isAnalyzing || analyzingSingleIndex !== null}
              >
                <Cloud className="w-3 h-3 mr-2" />
                Cloud AI (Gemini)
              </Button>
              <Button
                variant={useBrowserAi ? "default" : "outline"}
                size="sm"
                onClick={() => setUseBrowserAi(true)}
                disabled={isAnalyzing || analyzingSingleIndex !== null || !browserAiAvailable}
                title={browserAiAvailable === false ? "Je browser ondersteunt geen WebGPU" : undefined}
              >
                <Cpu className="w-3 h-3 mr-2" />
                Browser AI (Lokaal)
              </Button>
            </div>
            {browserAiAvailable === false && (
              <span className="text-xs text-muted-foreground">(WebGPU niet ondersteund)</span>
            )}
          </div>

          {/* Toelichting per methode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-muted-foreground">
            <div className={`rounded-md border p-3 space-y-1.5 ${!useBrowserAi ? 'border-primary/40 bg-primary/5' : 'border-border/50'}`}>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Cloud className="w-3 h-3" /> Cloud AI (Gemini)
              </p>
              <ul className="space-y-0.5">
                <li>✅ Nauwkeurigste analyse via Gemini</li>
                <li>✅ Werkt in elke browser</li>
                <li>⚠️ Kost AI-credits per vraag</li>
                <li>⚠️ Korte wachttijd tussen vragen</li>
              </ul>
            </div>
            <div className={`rounded-md border p-3 space-y-1.5 ${useBrowserAi ? 'border-primary/40 bg-primary/5' : 'border-border/50'}`}>
              <p className="font-semibold text-foreground flex items-center gap-1.5">
                <Cpu className="w-3 h-3" /> Browser AI (Lokaal)
              </p>
              <ul className="space-y-0.5">
                <li>✅ Volledig gratis, geen credits nodig</li>
                <li>✅ Privacy: data blijft in je browser</li>
                <li>⚠️ Vereist WebGPU (Chrome 113+)</li>
                <li>⚠️ Eerste keer laden duurt langer</li>
              </ul>
            </div>
          </div>
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
                {/* Show analyze button if no analysis exists for this FAQ */}
                {!analysis && (
                  <div className="mb-4 p-3 bg-muted/30 rounded-lg border border-dashed">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-muted-foreground">
                        Analyseer deze vraag om de AI Search Readiness score te bepalen
                      </p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => analyzeSingleFaq(index)}
                        disabled={analyzingSingleIndex === index || isAnalyzing}
                      >
                        {analyzingSingleIndex === index ? (
                          <>
                            <Loader2 className="w-3 h-3 mr-2 animate-spin" />
                            Analyseren...
                          </>
                        ) : (
                          <>
                            <Search className="w-3 h-3 mr-2" />
                            Analyseer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
                
                {/* Show analysis results with action buttons */}
                {analysis && (
                  <div className="mb-4 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <p className="text-sm font-medium mb-1">AI Search Readiness Analyse:</p>
                        <p className="text-sm text-muted-foreground">{analysis.explanation}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        {/* Always show re-analyze button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => analyzeSingleFaq(index)}
                          disabled={analyzingSingleIndex === index || isAnalyzing}
                          title="Opnieuw analyseren"
                        >
                          {analyzingSingleIndex === index ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Search className="w-3 h-3" />
                          )}
                        </Button>
                        {/* Show regenerate button for low/medium scores */}
                        {analysis.score < 70 && (
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
                  </div>
                )}
                
                <p className="text-muted-foreground">{faq.answer}</p>
                <div className="flex gap-2 mt-4 flex-wrap">
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
                  {isEnterprise && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setArticleOpenIndex(articleOpenIndex === index ? null : index)}
                    >
                      <FileText className="w-3 h-3 mr-2" />
                      {articleOpenIndex === index ? 'Sluit artikel' : 'Genereer artikel'}
                    </Button>
                  )}
                  {!isEnterprise && (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled
                      title="Alleen beschikbaar voor Enterprise abonnees"
                    >
                      <FileText className="w-3 h-3 mr-2" />
                      Genereer artikel
                      <Badge variant="secondary" className="ml-1 text-[10px] px-1">Enterprise</Badge>
                    </Button>
                  )}
                </div>
                {articleOpenIndex === index && isEnterprise && (
                  <ArticleGenerator
                    question={faq.question}
                    answer={faq.answer}
                    pageContent={pageContent}
                    onClose={() => setArticleOpenIndex(null)}
                  />
                )}
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
