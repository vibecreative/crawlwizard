import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Code2, Copy, CheckCircle2, Star } from "lucide-react";
import { toast } from "sonner";
import { ProductSchemaForm, buildProductSchema, type ProductInput } from "./ProductSchemaForm";

interface FaqItem {
  question: string;
  answer: string;
}

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
  faqs?: FaqItem[];
}

export const JsonLdGenerator = ({ url, meta, headings, faqs }: JsonLdGeneratorProps) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  // Page-type detection for smart recommendations
  const urlPath = (() => {
    try { return new URL(url).pathname.toLowerCase(); } catch { return '/'; }
  })();
  const isHomePage = urlPath === '/' || urlPath === '';
  const isContactPage = urlPath.includes('contact');
  const isAboutPage = urlPath.includes('over') || urlPath.includes('about');
  const isBlogPage = urlPath.includes('blog') || urlPath.includes('artikel');
  const hasFaqs = faqs && faqs.length > 0;

  const recommended: Record<string, boolean> = {
    website: true,
    organization: isHomePage || isContactPage || isAboutPage,
    breadcrumb: !isHomePage,
    article: isBlogPage,
    faqPage: !!hasFaqs,
  };

  const [selectedSchemas, setSelectedSchemas] = useState({
    website: true,
    organization: recommended.organization,
    breadcrumb: recommended.breadcrumb,
    article: recommended.article,
    faqPage: recommended.faqPage,
  });

  const getDomainName = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '');
      return domain.split('.')[0].charAt(0).toUpperCase() + domain.split('.')[0].slice(1);
    } catch {
      return "Your Company";
    }
  };

  const generateWebSiteSchema = () => {
    const baseUrl = (() => {
      try { return new URL(url).origin; } catch { return url; }
    })();

    const schema: any = {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "name": meta.title || getDomainName(url),
      "description": meta.description || "",
      "url": baseUrl,
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${baseUrl}/search?q={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
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

  const generateFaqPageSchema = () => {
    if (!faqs || faqs.length === 0) return null;
    
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

  const generateJsonLd = () => {
    const schemas: any[] = [];
    
    if (selectedSchemas.website) schemas.push(generateWebSiteSchema());
    if (selectedSchemas.organization) schemas.push(generateOrganizationSchema());
    if (selectedSchemas.breadcrumb) schemas.push(generateBreadcrumbSchema());
    if (selectedSchemas.article) schemas.push(generateArticleSchema());
    if (selectedSchemas.faqPage) {
      const faqSchema = generateFaqPageSchema();
      if (faqSchema) schemas.push(faqSchema);
    }

    if (schemas.length === 0) return "";

    const jsonLdContent = schemas.length === 1 ? schemas[0] : schemas;
    
    return `<script type="application/ld+json">
${JSON.stringify(jsonLdContent, null, 2)}
</script>`;
  };

  const handleCopy = async () => {
    const jsonLd = generateJsonLd();
    if (!jsonLd) {
      toast.error(t('jsonLd.selectMinOne'));
      return;
    }

    try {
      await navigator.clipboard.writeText(jsonLd);
      setCopied(true);
      toast.success(t('jsonLd.copySuccess'));
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t('jsonLd.copyFailed'));
    }
  };

  const selectedCount = Object.values(selectedSchemas).filter(Boolean).length;

  const schemaItems = [
    { key: 'website', label: t('jsonLd.websiteSchema'), desc: t('jsonLd.websiteDesc') },
    { key: 'organization', label: t('jsonLd.organizationSchema'), desc: t('jsonLd.organizationDesc') },
    { key: 'breadcrumb', label: t('jsonLd.breadcrumbSchema'), desc: t('jsonLd.breadcrumbDesc') },
    { key: 'article', label: t('jsonLd.articleSchema'), desc: t('jsonLd.articleDesc') },
    { key: 'faqPage', label: t('jsonLd.faqSchema'), desc: hasFaqs ? t('jsonLd.faqDescAvailable', { count: faqs!.length }) : t('jsonLd.faqDescUnavailable'), disabled: !hasFaqs },
  ];

  return (
    <Card className="p-6 shadow-soft">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2 mb-2">
            <Code2 className="h-5 w-5 text-primary" />
            {t('jsonLd.title')}
          </h3>
          <p className="text-sm text-muted-foreground">
            {t('jsonLd.subtitle')}
          </p>
        </div>
        <Badge variant="secondary" className="ml-2">
          {selectedCount} {t('jsonLd.selected')}
        </Badge>
      </div>

      <div className="space-y-4 mb-6">
        {schemaItems.map(({ key, label, desc, disabled }) => {
          const isRecommended = recommended[key];
          return (
            <label
              key={key}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                isRecommended
                  ? 'border-primary/40 bg-primary/5 hover:bg-primary/10'
                  : 'border-border hover:bg-secondary/30'
              }`}
            >
              <Checkbox
                checked={selectedSchemas[key as keyof typeof selectedSchemas]}
                onCheckedChange={(checked) =>
                  setSelectedSchemas(prev => ({ ...prev, [key]: checked as boolean }))
                }
                disabled={disabled}
              />
              <div className="flex-1">
                <div className="font-medium flex items-center gap-2">
                  {label}
                  {isRecommended && (
                    <Badge variant="default" className="text-[10px] px-1.5 py-0 h-5 gap-1">
                      <Star className="h-3 w-3" />
                      {t('jsonLd.recommended')}
                    </Badge>
                  )}
                </div>
                <div className="text-xs text-muted-foreground">
                  {desc}
                  {isRecommended && (
                    <span className="ml-1 text-primary font-medium">
                      {t('jsonLd.relevantForPage')}
                    </span>
                  )}
                </div>
              </div>
            </label>
          );
        })}

        <div className="h-px bg-border my-4" />

        <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
          <p className="text-sm text-muted-foreground">
            <strong className="text-primary">💡 {t('jsonLd.tip')}</strong> {t('jsonLd.combinedTip')}
          </p>
        </div>
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
                {t('jsonLd.copied')}
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                {t('jsonLd.copyButton')}
              </>
            )}
          </Button>

          <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
            <p className="text-sm text-muted-foreground">
              <strong>💡 {t('jsonLd.tip')}</strong> {t('jsonLd.headTip')}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
};
