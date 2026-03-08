import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useTranslation } from "react-i18next";

interface StructuredDataItem {
  type: string;
  data: any;
}

interface StructuredDataAnalysisProps {
  structuredData: StructuredDataItem[];
  url: string;
}

export const StructuredDataAnalysis = ({ structuredData, url }: StructuredDataAnalysisProps) => {
  const { t } = useTranslation();
  const hasStructuredData = structuredData.length > 0;
  
  const hasOrganization = structuredData.some(item => 
    item.type.includes('Organization') || 
    (Array.isArray(item.data) && item.data.some((d: any) => d['@type'] === 'Organization'))
  );
  const hasWebsite = structuredData.some(item => 
    item.type.includes('WebSite') || 
    (Array.isArray(item.data) && item.data.some((d: any) => d['@type'] === 'WebSite'))
  );
  const hasBreadcrumb = structuredData.some(item => 
    item.type.includes('BreadcrumbList') || 
    (Array.isArray(item.data) && item.data.some((d: any) => d['@type'] === 'BreadcrumbList'))
  );
  const hasProduct = structuredData.some(item => 
    item.type.includes('Product') || 
    (Array.isArray(item.data) && item.data.some((d: any) => d['@type'] === 'Product'))
  );
  const hasArticle = structuredData.some(item => 
    item.type.includes('Article') || 
    (Array.isArray(item.data) && item.data.some((d: any) => d['@type'] === 'Article'))
  );

  const missingRecommendations = [];
  
  const urlPath = new URL(url).pathname.toLowerCase();
  const isHomePage = urlPath === '/' || urlPath === '';
  const isContactPage = urlPath.includes('contact');
  const isAboutPage = urlPath.includes('over') || urlPath.includes('about');
  const isProductPage = urlPath.includes('product') || urlPath.includes('shop');
  const isBlogPage = urlPath.includes('blog') || urlPath.includes('artikel');
  
  if (!hasOrganization && (isHomePage || isContactPage || isAboutPage)) {
    missingRecommendations.push('Organization');
  }
  if (!hasWebsite) missingRecommendations.push(t("structuredData.websiteWithSearchbox"));
  if (!hasBreadcrumb) missingRecommendations.push('BreadcrumbList');
  if (isProductPage && !hasProduct) missingRecommendations.push(t("structuredData.productSchema"));
  if (isBlogPage && !hasArticle) missingRecommendations.push(t("structuredData.articleSchema"));

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

      {hasStructuredData && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            {t("structuredData.foundSchemaTypes")}
          </h4>
          <div className="flex flex-wrap gap-2">
            {structuredData.map((item, index) => (
              <Badge key={index} variant="secondary" className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30">
                {item.type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {missingRecommendations.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Lightbulb className="h-4 w-4" />
            {t("structuredData.improvementPlan")}
          </h4>
          
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-2">{t("structuredData.recommendedTypes")}</p>
              <ul className="space-y-1 ml-4">
                {missingRecommendations.map((rec, index) => (
                  <li key={index} className="text-sm">• {rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <h5 className="font-semibold text-sm">{t("structuredData.implementationTips")}</h5>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p><strong>{t("structuredData.tip1Title")}</strong><br/>{t("structuredData.tip1Desc")}</p>
              <p><strong>{t("structuredData.tip2Title")}</strong><br/>{t("structuredData.tip2Desc")}</p>
              <p><strong>{t("structuredData.tip3Title")}</strong><br/>{t("structuredData.tip3Desc")}</p>
            </div>
          </div>
        </div>
      )}

      {hasStructuredData && missingRecommendations.length === 0 && (
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