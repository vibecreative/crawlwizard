import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface JsonLdGeneratorProps {
  url: string;
  meta: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  headings: Array<{ level: number; text: string }>;
}

export const JsonLdGenerator = ({ url, meta, headings }: JsonLdGeneratorProps) => {
  const [copied, setCopied] = useState(false);
  const [selectedSchemas, setSelectedSchemas] = useState({
    website: true,
    organization: false,
    breadcrumb: false,
    article: false,
  });

  const allSelected = selectedSchemas.website && selectedSchemas.organization && 
                      selectedSchemas.breadcrumb && selectedSchemas.article;

  const handleSelectAll = (checked: boolean) => {
    setSelectedSchemas({
      website: checked,
      organization: checked,
      breadcrumb: checked,
      article: checked,
    });
  };

  const getDomainName = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return "Uw Bedrijf";
    }
  };

  const generateWebSiteSchema = () => {
    const schema = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": meta.title || getDomainName(url),
      "description": meta.description || "",
      "url": url,
    };
    
    if (meta.ogImage) {
      schema["image"] = meta.ogImage;
    }
    
    return schema;
  };

  const generateOrganizationSchema = () => {
    const domain = new URL(url).hostname.replace('www.', '');
    return {
      "@context": "https://schema.org",
      "@type": "Organization",
      "name": getDomainName(url),
      "url": url,
      "logo": meta.ogImage || `${url}/logo.png`,
      "description": meta.description || "",
      "contactPoint": {
        "@type": "ContactPoint",
        "contactType": "customer service",
        "email": `info@${domain}`
      }
    };
  };

  const generateBreadcrumbSchema = () => {
    const pathParts = new URL(url).pathname.split('/').filter(Boolean);
    const baseUrl = new URL(url).origin;
    
    const itemListElement = [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": baseUrl
      }
    ];

    pathParts.forEach((part, index) => {
      const path = '/' + pathParts.slice(0, index + 1).join('/');
      itemListElement.push({
        "@type": "ListItem",
        "position": index + 2,
        "name": part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
        "item": baseUrl + path
      });
    });

    return {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": itemListElement
    };
  };

  const generateArticleSchema = () => {
    const h1 = headings.find(h => h.level === 1);
    
    return {
      "@context": "https://schema.org",
      "@type": "Article",
      "headline": h1?.text || meta.title || "",
      "description": meta.description || "",
      "url": url,
      "image": meta.ogImage || "",
      "author": {
        "@type": "Organization",
        "name": getDomainName(url)
      },
      "publisher": {
        "@type": "Organization",
        "name": getDomainName(url),
        "logo": {
          "@type": "ImageObject",
          "url": meta.ogImage || `${url}/logo.png`
        }
      },
      "datePublished": new Date().toISOString(),
      "dateModified": new Date().toISOString()
    };
  };

  const generateJsonLd = () => {
    const schemas: any[] = [];
    
    if (selectedSchemas.website) schemas.push(generateWebSiteSchema());
    if (selectedSchemas.organization) schemas.push(generateOrganizationSchema());
    if (selectedSchemas.breadcrumb) schemas.push(generateBreadcrumbSchema());
    if (selectedSchemas.article) schemas.push(generateArticleSchema());

    if (schemas.length === 0) return "";

    // If multiple schemas, wrap in array
    const jsonLdContent = schemas.length === 1 ? schemas[0] : schemas;
    
    return `<script type="application/ld+json">
${JSON.stringify(jsonLdContent, null, 2)}
</script>`;
  };

  const handleCopy = async () => {
    const jsonLd = generateJsonLd();
    if (!jsonLd) {
      toast.error("Selecteer minimaal één schema type");
      return;
    }

    try {
      await navigator.clipboard.writeText(jsonLd);
      setCopied(true);
      toast.success("JSON-LD gekopieerd naar klembord!");
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error("Kopiëren mislukt");
    }
  };

  const selectedCount = Object.values(selectedSchemas).filter(Boolean).length;

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2 mb-2">
            <Code2 className="h-5 w-5 text-primary" />
            JSON-LD Generator
          </h3>
          <p className="text-sm text-muted-foreground">
            Genereer complete structured data voor uw website
          </p>
        </div>
        <Badge variant="secondary" className="ml-2">
          {selectedCount} geselecteerd
        </Badge>
      </div>

      <div className="space-y-4 mb-6">
        <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors cursor-pointer">
          <Checkbox
            checked={selectedSchemas.website}
            onCheckedChange={(checked) =>
              setSelectedSchemas(prev => ({ ...prev, website: checked as boolean }))
            }
          />
          <div className="flex-1">
            <div className="font-medium">WebSite Schema</div>
            <div className="text-xs text-muted-foreground">
              Basisinformatie over uw website (aanbevolen)
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors cursor-pointer">
          <Checkbox
            checked={selectedSchemas.organization}
            onCheckedChange={(checked) =>
              setSelectedSchemas(prev => ({ ...prev, organization: checked as boolean }))
            }
          />
          <div className="flex-1">
            <div className="font-medium">Organization Schema</div>
            <div className="text-xs text-muted-foreground">
              Bedrijfsinformatie en contactgegevens
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors cursor-pointer">
          <Checkbox
            checked={selectedSchemas.breadcrumb}
            onCheckedChange={(checked) =>
              setSelectedSchemas(prev => ({ ...prev, breadcrumb: checked as boolean }))
            }
          />
          <div className="flex-1">
            <div className="font-medium">BreadcrumbList Schema</div>
            <div className="text-xs text-muted-foreground">
              Navigatiestructuur voor deze pagina
            </div>
          </div>
        </label>

        <label className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-secondary/30 transition-colors cursor-pointer">
          <Checkbox
            checked={selectedSchemas.article}
            onCheckedChange={(checked) =>
              setSelectedSchemas(prev => ({ ...prev, article: checked as boolean }))
            }
          />
          <div className="flex-1">
            <div className="font-medium">Article Schema</div>
            <div className="text-xs text-muted-foreground">
              Voor artikelen, blog posts en nieuwsberichten
            </div>
          </div>
        </label>

        <div className="h-px bg-border my-4" />

        <label className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary/50 bg-primary/5 hover:bg-primary/10 transition-colors cursor-pointer">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
          <div className="flex-1">
            <div className="font-semibold text-primary">Selecteer alles</div>
            <div className="text-xs text-muted-foreground">
              Genereer alle schema types in één gecombineerde JSON-LD code
            </div>
          </div>
        </label>
      </div>

      {selectedCount > 0 && (
        <div className="space-y-4">
          <div className="relative">
            <pre className="bg-secondary/50 p-4 rounded-lg text-xs overflow-x-auto max-h-96 border border-border">
              <code>{generateJsonLd()}</code>
            </pre>
          </div>

          <Button
            onClick={handleCopy}
            className="w-full gap-2"
            variant={copied ? "outline" : "default"}
          >
            {copied ? (
              <>
                <CheckCircle2 className="h-4 w-4" />
                Gekopieerd!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Kopieer JSON-LD Code
              </>
            )}
          </Button>

          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm text-muted-foreground">
              <strong>💡 Tip:</strong> Plak deze code in de <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">&lt;head&gt;</code> sectie van uw HTML, 
              bij voorkeur vlak voor de sluitende <code className="px-1.5 py-0.5 bg-secondary rounded text-xs">&lt;/head&gt;</code> tag.
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
