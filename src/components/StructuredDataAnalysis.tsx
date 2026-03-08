import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Code2, AlertCircle, CheckCircle2, Lightbulb } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface StructuredDataItem {
  type: string;
  data: any;
}

interface StructuredDataAnalysisProps {
  structuredData: StructuredDataItem[];
  url: string;
}

export const StructuredDataAnalysis = ({ structuredData, url }: StructuredDataAnalysisProps) => {
  const hasStructuredData = structuredData.length > 0;
  
  // Check for common schema types
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

  const hasLocalBusiness = structuredData.some(item => 
    item.type.includes('LocalBusiness') || 
    (Array.isArray(item.data) && item.data.some((d: any) => d['@type'] === 'LocalBusiness'))
  );

  const missingRecommendations = [];
  
  // Context-aware recommendations based on URL
  const urlPath = new URL(url).pathname.toLowerCase();
  const isHomePage = urlPath === '/' || urlPath === '';
  const isContactPage = urlPath.includes('contact');
  const isAboutPage = urlPath.includes('over') || urlPath.includes('about');
  const isProductPage = urlPath.includes('product') || urlPath.includes('shop');
  const isBlogPage = urlPath.includes('blog') || urlPath.includes('artikel');
  
  // Organization: only suggest for homepage, contact, or about pages
  if (!hasOrganization && (isHomePage || isContactPage || isAboutPage)) {
    missingRecommendations.push('Organization');
  }
  
  if (!hasWebsite) missingRecommendations.push('WebSite (met sitelinks searchbox)');
  if (!hasBreadcrumb) missingRecommendations.push('BreadcrumbList');
  
  if (isProductPage && !hasProduct) {
    missingRecommendations.push('Product schema (voor productpagina)');
  }
  
  if (isBlogPage && !hasArticle) {
    missingRecommendations.push('Article schema (voor blogposts)');
  }

  return (
    <Card className="p-6 shadow-soft">
      <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
        <Code2 className="h-5 w-5 text-primary" />
        Rich Snippets & Structured Data
      </h3>

      {/* Context Explanation */}
      <div className="mb-6 p-4 bg-secondary/30 rounded-lg text-sm text-muted-foreground space-y-1.5">
        <p className="font-medium text-foreground">Waarom zie ik niet alle schema's?</p>
        <p>
          Niet elke pagina heeft dezelfde structured data nodig. CrawlWizard analyseert het type pagina 
          (homepage, productpagina, blog, etc.) en toont alleen de schema's die relevant zijn. 
          Zo voorkom je onnodige of dubbele markup — iets wat zoekmachines juist als een negatief signaal 
          kunnen zien.
        </p>
      </div>

      {/* Status Overview */}
      <div className="mb-6">
        {hasStructuredData ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-700 dark:text-green-400">
              Er is structured data gevonden op deze pagina! ({structuredData.length} {structuredData.length === 1 ? 'type' : 'types'})
            </AlertDescription>
          </Alert>
        ) : (
          <Alert className="border-orange-500/50 bg-orange-500/10">
            <AlertCircle className="h-4 w-4 text-orange-600" />
            <AlertDescription className="text-orange-700 dark:text-orange-400">
              Geen structured data gevonden. Dit is een gemiste SEO-kans!
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Found Structured Data */}
      {hasStructuredData && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">
            Gevonden Schema Types
          </h4>
          <div className="flex flex-wrap gap-2">
            {structuredData.map((item, index) => (
              <Badge 
                key={index} 
                variant="secondary"
                className="bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30"
              >
                {item.type}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Recommendations */}
      {missingRecommendations.length > 0 && (
        <div className="space-y-4">
          <h4 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
            <Lightbulb className="h-4 w-4" />
            Verbeterplan
          </h4>
          
          <Alert className="border-blue-500/50 bg-blue-500/10">
            <AlertDescription className="text-blue-700 dark:text-blue-400">
              <p className="font-medium mb-2">Aanbevolen structured data types om toe te voegen:</p>
              <ul className="space-y-1 ml-4">
                {missingRecommendations.map((rec, index) => (
                  <li key={index} className="text-sm">• {rec}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <div className="bg-secondary/30 rounded-lg p-4 space-y-3">
            <h5 className="font-semibold text-sm">Implementatie Tips:</h5>
            <div className="space-y-2 text-sm text-muted-foreground">
              <p>
                <strong>1. JSON-LD (Aanbevolen)</strong><br/>
                Voeg JSON-LD scripts toe in de {'<head>'} of {'<body>'} van je pagina. Dit is de meest 
                flexibele en onderhoudsvriendelijke methode.
              </p>
              <p>
                <strong>2. Test je implementatie</strong><br/>
                Gebruik Google's Rich Results Test tool om je structured data te valideren voordat 
                je live gaat.
              </p>
              <p>
                <strong>3. Belangrijkste voordelen:</strong><br/>
                • Betere zichtbaarheid in zoekresultaten<br/>
                • Rich snippets met sterren, prijzen, afbeeldingen<br/>
                • Hogere click-through rates (CTR)<br/>
                • Betere begrip van je content door zoekmachines
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Perfect Score Message */}
      {hasStructuredData && missingRecommendations.length === 0 && (
        <Alert className="border-green-500/50 bg-green-500/10">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-700 dark:text-green-400">
            Uitstekend! Deze pagina heeft alle basis structured data geïmplementeerd.
          </AlertDescription>
        </Alert>
      )}
    </Card>
  );
};
