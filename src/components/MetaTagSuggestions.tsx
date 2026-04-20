import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useViewAsUserId } from "@/hooks/useViewAsUserId";
import { toast } from "sonner";

interface MetaSuggestion {
  value: string;
  explanation: string;
}

interface MetaSuggestions {
  title: MetaSuggestion;
  metaDescription: MetaSuggestion;
  ogTitle: MetaSuggestion;
  ogDescription: MetaSuggestion;
}

interface MetaTagSuggestionsProps {
  url: string;
  pageContent: string;
  currentMeta: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  onCreditsUsed?: () => void;
}

const charLimits: Record<string, { max: number; label: string }> = {
  title: { max: 60, label: "Title Tag" },
  metaDescription: { max: 155, label: "Meta Description" },
  ogTitle: { max: 60, label: "Open Graph Title" },
  ogDescription: { max: 200, label: "Open Graph Description" },
};

export const MetaTagSuggestions = ({ url, pageContent, currentMeta, onCreditsUsed }: MetaTagSuggestionsProps) => {
  const { i18n } = useTranslation();
  const viewAsUserId = useViewAsUserId();
  const [suggestions, setSuggestions] = useState<MetaSuggestions | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const generateSuggestions = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-meta-tags", {
        body: { url, pageContent, currentMeta, language: i18n.language, viewAsUserId: viewAsUserId || undefined },
      });

      if (error) throw error;
      if (data?.error) {
        toast.error(data.error);
        return;
      }

      setSuggestions(data);
      onCreditsUsed?.();
      toast.success("Meta-tag suggesties gegenereerd!");
    } catch (error: any) {
      console.error("Error generating meta tags:", error);
      toast.error("Kon meta-tags niet genereren");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Gekopieerd naar klembord");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const getCharColor = (length: number, max: number) => {
    if (length <= max) return "text-emerald-600 dark:text-emerald-400";
    return "text-destructive";
  };

  if (!suggestions) {
    return (
      <div className="mt-6 pt-6 border-t border-border">
        <Button
          onClick={generateSuggestions}
          disabled={isGenerating}
          variant="outline"
          className="w-full gap-2 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground transition-colors"
        >
          {isGenerating ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Meta-tags genereren...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              AI Meta-tag Suggesties (1 credit)
            </>
          )}
        </Button>
      </div>
    );
  }

  const fields: Array<{ key: keyof MetaSuggestions; label: string; max: number }> = [
    { key: "title", label: "Title Tag", max: 60 },
    { key: "metaDescription", label: "Meta Description", max: 155 },
    { key: "ogTitle", label: "Open Graph Title", max: 60 },
    { key: "ogDescription", label: "Open Graph Description", max: 200 },
  ];

  return (
    <div className="mt-6 pt-6 border-t border-border space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-semibold flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          AI Suggesties
        </h4>
        <Button
          onClick={generateSuggestions}
          disabled={isGenerating}
          variant="ghost"
          size="sm"
          className="text-xs gap-1"
        >
          {isGenerating ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
          Opnieuw genereren
        </Button>
      </div>

      {fields.map(({ key, label, max }) => {
        const suggestion = suggestions[key];
        const length = suggestion.value.length;

        return (
          <div key={key} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                {label}
              </label>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono ${getCharColor(length, max)}`}>
                  {length}/{max}
                </span>
                {length <= max && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    ✓
                  </Badge>
                )}
              </div>
            </div>
            <div className="relative group">
              <p className="text-sm p-3 pr-10 bg-primary/5 border border-primary/20 rounded-lg">
                {suggestion.value}
              </p>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-1.5 right-1.5 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => copyToClipboard(suggestion.value, key)}
              >
                {copiedField === key ? (
                  <Check className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <Copy className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground italic">
              {suggestion.explanation}
            </p>
          </div>
        );
      })}
    </div>
  );
};
