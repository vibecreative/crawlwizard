import { Card } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSuggestionsProps {
  faqs: FaqItem[];
}

export const FaqSuggestions = ({ faqs }: FaqSuggestionsProps) => {
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

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold mb-2">FAQ Suggesties</h3>
          <p className="text-sm text-muted-foreground">
            AI-gegenereerde vraag en antwoord paren op basis van de pagina content
          </p>
        </div>
        <div className="flex gap-2">
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

      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, index) => (
          <AccordionItem key={index} value={`faq-${index}`}>
            <AccordionTrigger className="text-left">
              <span className="font-medium">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent>
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
        ))}
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
