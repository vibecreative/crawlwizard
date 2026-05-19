import { useEffect, useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, AlertCircle, CheckCircle2, Lightbulb, Globe, FileText, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";
import { supabase } from "@/integrations/supabase/client";

interface StructuredDataItem {
  type: string;
  data: any;
}

interface StructuredDataAnalysisProps {
  structuredData: StructuredDataItem[];
  url: string;
  projectId?: string;
  currentPageId?: string;
}

// Strip our "JSON-LD: " / "(2)" suffix to get the bare schema type
const baseType = (label: string): string => {
  const stripped = label.replace(/^JSON-LD:\s*/i, "").replace(/\s*\(\d+\)$/, "").trim();
  return stripped || label;
};

const extractTypesFromAnalysis = (analysisData: any): Set<string> => {
  const types = new Set<string>();
  const sd: any[] = analysisData?.structuredData || [];
  for (const item of sd) {
    if (item?.type) types.add(baseType(item.type));
  }
  return types;
};

export const StructuredDataAnalysis = ({ structuredData, url, projectId, currentPageId }: StructuredDataAnalysisProps) => {
  const { t } = useTranslation();
  const hasStructuredData = structuredData.length > 0;

  // ── Sitewide vs page-specific detection ──────────────────────────────────
  const [sitewideTypes, setSitewideTypes] = useState<Set<string>>(new Set());
  const [pagesChecked, setPagesChecked] = useState<number>(0);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("project_pages")
        .select("id, analysis_data")
        .eq("project_id", projectId)
        .eq("status", "completed")
        .limit(50);
      if (error || !data || cancelled) return;

      const others = data.filter((p) => p.id !== currentPageId);
      if (others.length === 0) {
        setPagesChecked(0);
        return;
      }

      // Count how often each type appears across other pages
      const counts = new Map<string, number>();
      for (const page of others) {
        const types = extractTypesFromAnalysis(page.analysis_data);
        types.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1));
      }

      // Sitewide = appears on >= 60% of other pages (and at least 2)
      const threshold = Math.max(2, Math.ceil(others.length * 0.6));
      const sitewide = new Set<string>();
      counts.forEach((count, type) => {
        if (count >= threshold) sitewide.add(type);
      });

      setSitewideTypes(sitewide);
      setPagesChecked(others.length);
    })();
    return () => {
      cancelled = true;
    };
  }, [projectId, currentPageId]);

  // ── Categorize current page schemas ─────────────────────────────────────
  const categorized = useMemo(() => {
    return structuredData.map((item) => {
      const bt = baseType(item.type);
      const isSitewide = sitewideTypes.has(bt);
      return { ...item, baseType: bt, isSitewide };
    });
  }, [structuredData, sitewideTypes]);

  const sitewideOnPage = categorized.filter((c) => c.isSitewide);
  const pageSpecificOnPage = categorized.filter((c) => !c.isSitewide);

  // ── Gap analysis ────────────────────────────────────────────────────────
  const presentTypes = new Set(categorized.map((c) => c.baseType));
  const has = (...names: string[]) => names.some((n) => presentTypes.has(n));

  let urlPath = "/";
  try { urlPath = new URL(url).pathname.toLowerCase(); } catch {}
  const isHomePage = urlPath === "/" || urlPath === "";
  const isContactPage = urlPath.includes("contact");
  const isAboutPage = urlPath.includes("over") || urlPath.includes("about");
  const isProductPage = /\/(product|producten|products|shop|winkel|webshop)(\/|$)/.test(urlPath);
  const isBlogPage = urlPath.includes("blog") || urlPath.includes("artikel") || urlPath.includes("nieuws");

  type Gap = { type: string; reason: string; priority: "high" | "medium" | "low" };
  const gaps: Gap[] = [];

  if (!has("WebSite")) {
    gaps.push({ type: "WebSite", reason: "Basis-schema voor de hele site — helpt zoekmachines de sitemap en sitenaam te begrijpen.", priority: "medium" });
  }
  if (!has("Organization", "LocalBusiness") && (isHomePage || isContactPage || isAboutPage)) {
    gaps.push({ type: "Organization of LocalBusiness", reason: "Belangrijk op homepage/contact/over-pagina's voor merkidentiteit in Google Knowledge Panel en AI-antwoorden.", priority: "high" });
  }
  if (!has("BreadcrumbList") && !isHomePage) {
    gaps.push({ type: "BreadcrumbList", reason: "Toont navigatiepad in zoekresultaten — verbetert CTR en context voor LLM's.", priority: "medium" });
  }
  if (isProductPage && !has("Product")) {
    gaps.push({ type: "Product", reason: "Vereist op productpagina's voor rich snippets (prijs, voorraad, reviews).", priority: "high" });
  }
  if (isBlogPage && !has("Article", "BlogPosting", "NewsArticle")) {
    gaps.push({ type: "Article of BlogPosting", reason: "Standaard voor blogartikelen — verbetert weergave in Google Discover en AI-citaten.", priority: "high" });
  }

  const allGood = hasStructuredData && gaps.length === 0;

  return (
    <Card className="p-6 shadow-soft">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Code2 className="h-5 w-5 text-primary" />
        {t("structuredData.title")}
      </h3>

      <div className="mb-6 p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">{t("structuredData.whyNotAllSchemas")}</p>
        <p>{t("structuredData.explanation")}</p>
      </div>

      {/* Overall status */}
      <div className="mb-6">
        {hasStructuredData ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              {t("structuredData.found")} ({structuredData.length === 1 ? t("structuredData.typeCount", { count: structuredData.length }) : t("structuredData.typesCount", { count: structuredData.length })})
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700 dark:text-orange-400">
              {t("structuredData.notFound")}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Sitewide vs page-specific split */}
      {hasStructuredData && (
        <div className="mb-6 space-y-4">
          {projectId && pagesChecked > 0 && (
            <div className="p-3 rounded-lg border border-blue-500/30 bg-blue-500/5 text-xs text-blue-700 dark:text-blue-400 flex items-start gap-2">
              <Info className="h-3.5 w-3.5 mt-0.5 shrink-0" />
              <span>
                Vergeleken met <strong>{pagesChecked}</strong> andere geanalyseerde pagina's in dit project.
                Schema's die op de meeste pagina's voorkomen worden als <em>sitebreed</em> gemarkeerd
                (vaak automatisch geplaatst door het CMS).
              </span>
            </div>
          )}

          {sitewideOnPage.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <Globe className="h-4 w-4" />
                Sitebreed aanwezig
              </h4>
              <div className="flex flex-wrap gap-2">
                {sitewideOnPage.map((item, i) => (
                  <Badge key={i} variant="secondary" className="bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30 gap-1">
                    <Globe className="h-3 w-3" />
                    {item.baseType}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Deze schema's komen op (vrijwel) elke pagina voor — meestal automatisch door het CMS geplaatst (bijv. Duda, WordPress, Shopify).
                Het is doorgaans <strong>niet nodig</strong> om deze ook handmatig per pagina toe te voegen via de JSON-LD generator.
              </p>
            </div>
          )}

          {pageSpecificOnPage.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold mb-2 flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                <FileText className="h-4 w-4" />
                Pagina-specifiek aanwezig
              </h4>
              <div className="flex flex-wrap gap-2">
                {pageSpecificOnPage.map((item, i) => (
                  <Badge key={i} variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30 gap-1">
                    <FileText className="h-3 w-3" />
                    {item.baseType}
                  </Badge>
                ))}
              </div>
              {projectId && pagesChecked > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  Uniek voor deze pagina — dit is precies waar CrawlWizard meerwaarde levert: pagina-specifieke structured data verbetert relevantie voor SEO en AI-antwoorden.
                </p>
              )}
            </div>
          )}

          {/* Fallback when we couldn't determine sitewide context */}
          {(!projectId || pagesChecked === 0) && (
            <div>
              <h4 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">
                {t("structuredData.foundSchemaTypes")}
              </h4>
              <div className="flex flex-wrap gap-2">
                {categorized.map((item, i) => (
                  <Badge key={i} variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                    {item.baseType}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Gap analysis */}
      {gaps.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Lightbulb className="h-4 w-4" />
            Ontbrekende schema's voor deze pagina
          </h4>

          <div className="space-y-2">
            {gaps.map((gap, i) => (
              <div
                key={i}
                className={`p-3 rounded-lg border text-sm flex items-start gap-3 ${
                  gap.priority === "high"
                    ? "border-orange-500/40 bg-orange-500/5"
                    : "border-border bg-secondary/30"
                }`}
              >
                <AlertCircle className={`h-4 w-4 mt-0.5 shrink-0 ${
                  gap.priority === "high" ? "text-orange-600" : "text-muted-foreground"
                }`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <strong className="text-foreground">{gap.type}</strong>
                    {gap.priority === "high" && (
                      <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-orange-500/40 text-orange-700 dark:text-orange-400">
                        Aanbevolen
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{gap.reason}</p>
                </div>
              </div>
            ))}
          </div>

          <Alert className="border-primary/30 bg-primary/5">
            <Lightbulb className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm text-muted-foreground">
              Gebruik de <strong className="text-foreground">JSON-LD generator</strong> hieronder om deze schema's per pagina te genereren en in te voegen.
              {sitewideOnPage.length > 0 && " Voor sitebreed aanwezige types (zoals WebSite of LocalBusiness) hoef je deze meestal niet opnieuw toe te voegen — het CMS plaatst ze al."}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {allGood && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            {t("structuredData.perfectScore")}
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
};
