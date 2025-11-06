import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Hash, TrendingUp, RotateCcw, ChevronDown } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HeadingStructureScore } from "./HeadingStructureScore";
import { StructuredDataAnalysis } from "./StructuredDataAnalysis";
import { JsonLdGenerator } from "./JsonLdGenerator";
import { FaqSuggestions } from "./FaqSuggestions";

interface HeadingInfo {
  level: number;
  text: string;
  position: { top: number; left: number };
  content?: string;
}

interface StructuredDataItem {
  type: string;
  data: any;
}

interface FaqItem {
  question: string;
  answer: string;
}

interface AnalysisData {
  url: string;
  screenshot?: string;
  headings: HeadingInfo[];
  meta: {
    title?: string;
    description?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
  };
  structuredData: StructuredDataItem[];
  html: string;
  faqs?: FaqItem[];
}

interface AnalysisResultsProps {
  data: AnalysisData;
  onReset: () => void;
}

export const AnalysisResults = ({ data, onReset }: AnalysisResultsProps) => {
  const getHeadingColor = (level: number) => {
    const colors = {
      1: "bg-heading-h1",
      2: "bg-heading-h2", 
      3: "bg-heading-h3",
      4: "bg-heading-h4",
      5: "bg-heading-h5",
      6: "bg-heading-h6",
    };
    return colors[level as keyof typeof colors] || "bg-primary";
  };

  const headingCounts = data.headings.reduce((acc, h) => {
    acc[h.level] = (acc[h.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  return (
    <div className="w-full max-w-7xl mx-auto space-y-8">
      {/* Header with URL */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl gradient-primary">
            <FileText className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Analyse Resultaten</h2>
            <a 
              href={data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-muted-foreground hover:text-accent flex items-center gap-1 mt-1"
            >
              {data.url}
              <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </div>
        <Button 
          onClick={onReset}
          variant="outline"
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Nieuwe analyse
        </Button>
      </div>

      {/* Heading Structure Score - Prominent at top */}
      <HeadingStructureScore headings={data.headings} />

      {/* Visual Screenshot with Heading Markers */}
      {data.screenshot && (
        <Card className="p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Heading Structuur Visualisatie
          </h3>
          <div className="relative inline-block max-w-full">
            <img 
              src={data.screenshot} 
              alt="Website screenshot" 
              className="rounded-lg border border-border w-full"
            />
            {/* Note: In a real implementation, we would overlay heading markers on the screenshot */}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heading Structure */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Heading Structuur
          </h3>
          
          <div className="space-y-3 mb-6">
            {[1, 2, 3, 4, 5, 6].map((level) => (
              <div key={level} className="flex items-center gap-3">
                <Badge className={`${getHeadingColor(level)} text-white px-3 py-1`}>
                  H{level}
                </Badge>
                <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getHeadingColor(level)}`}
                    style={{ width: `${(headingCounts[level] || 0) * 20}%`, maxWidth: '100%' }}
                  />
                </div>
                <span className="text-sm font-medium w-8 text-right">
                  {headingCounts[level] || 0}
                </span>
              </div>
            ))}
          </div>

          <div className="space-y-4 max-h-96 overflow-y-auto">
            {(() => {
              // First, sort headings by their position on the page (top to bottom)
              const sortedHeadings = [...data.headings].sort((a, b) => a.position.top - b.position.top);
              
              console.log('Sorted headings:', sortedHeadings.map(h => ({ 
                level: h.level, 
                text: h.text.substring(0, 50), 
                top: h.position.top 
              })));
              
              // Group headings by H2 sections
              const groups: Array<{ h2?: HeadingInfo; children: HeadingInfo[] }> = [];
              let currentGroup: { h2?: HeadingInfo; children: HeadingInfo[] } | null = null;
              
              sortedHeadings.forEach((heading, idx) => {
                console.log(`Processing heading ${idx}: H${heading.level} - ${heading.text.substring(0, 30)}`);
                
                if (heading.level === 1) {
                  // Save current group if exists
                  if (currentGroup && (currentGroup.h2 || currentGroup.children.length > 0)) {
                    console.log('Saving H2 group before H1:', currentGroup.h2?.text);
                    groups.push(currentGroup);
                  }
                  // H1 gets its own standalone display
                  groups.push({ children: [heading] });
                  currentGroup = null;
                } else if (heading.level === 2) {
                  // Save previous H2 group if exists
                  if (currentGroup && (currentGroup.h2 || currentGroup.children.length > 0)) {
                    console.log('Saving previous H2 group:', currentGroup.h2?.text, 'with', currentGroup.children.length, 'children');
                    groups.push(currentGroup);
                  }
                  // Start new H2 group
                  console.log('Starting new H2 group:', heading.text);
                  currentGroup = { h2: heading, children: [] };
                } else {
                  // H3, H4, H5, H6 - add to current group
                  if (!currentGroup) {
                    // If no H2 group exists yet, create orphan group
                    console.log('Creating orphan group for:', heading.text);
                    currentGroup = { children: [heading] };
                  } else {
                    console.log('Adding to current H2 group:', heading.text);
                    currentGroup.children.push(heading);
                  }
                }
              });
              
              // Push last group
              if (currentGroup && (currentGroup.h2 || currentGroup.children.length > 0)) {
                console.log('Saving final group:', currentGroup.h2?.text, 'with', currentGroup.children.length, 'children');
                groups.push(currentGroup);
              }
              
              console.log('Total groups created:', groups.length);
              
              return groups.map((group, groupIdx) => {
                // Handle H1 standalone
                if (group.children.length === 1 && group.children[0].level === 1) {
                  const h1 = group.children[0];
                  return (
                    <div key={`h1-${groupIdx}`} className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border-2 border-primary/30">
                      <Badge className={`${getHeadingColor(1)} text-white shrink-0`}>
                        H1
                      </Badge>
                      <p className="text-sm flex-1 font-semibold">{h1.text}</p>
                    </div>
                  );
                }
                
                // Handle H2 groups
                if (!group.h2) return null;
                
                return (
                  <div key={`group-${groupIdx}`} className="border border-border/50 rounded-lg p-3 bg-secondary/20">
                    {/* H2 Header */}
                    <Collapsible>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-start gap-3 p-2 rounded-lg bg-secondary/50 hover:bg-secondary/60 transition-colors group">
                          <Badge className={`${getHeadingColor(2)} text-white shrink-0`}>
                            H2
                          </Badge>
                          <p className="text-sm flex-1 font-medium text-left">{group.h2.text}</p>
                          {group.h2.content && (
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      {group.h2.content && (
                        <CollapsibleContent className="mt-2">
                          <div className="text-xs text-muted-foreground p-3 rounded-md bg-background/50 whitespace-pre-wrap ml-2 border-l-2 border-primary/30">
                            {group.h2.content}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                    
                    {/* Children (H3, H4, etc.) */}
                    {group.children.length > 0 && (
                      <div className="ml-4 space-y-2 mt-2">
                        {group.children.map((child, childIdx) => {
                          const indentLevel = Math.max(0, child.level - 3); // H3 = 0, H4 = 1, etc.
                          const marginLeft = indentLevel * 20;
                          
                          return (
                            <Collapsible key={`child-${groupIdx}-${childIdx}`}>
                              <CollapsibleTrigger className="w-full">
                                <div 
                                  className="flex items-start gap-3 p-2 rounded-lg bg-background/50 hover:bg-secondary/30 transition-colors group"
                                  style={{ marginLeft: `${marginLeft}px` }}
                                >
                                  <Badge className={`${getHeadingColor(child.level)} text-white shrink-0 text-xs`}>
                                    H{child.level}
                                  </Badge>
                                  <p className="text-sm flex-1 text-left">{child.text}</p>
                                  {child.content && (
                                    <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                                  )}
                                </div>
                              </CollapsibleTrigger>
                              {child.content && (
                                <CollapsibleContent className="mt-2">
                                  <div 
                                    className="text-xs text-muted-foreground p-2 rounded-md bg-background/30 whitespace-pre-wrap ml-2 border-l-2 border-muted"
                                    style={{ marginLeft: `${marginLeft}px` }}
                                  >
                                    {child.content}
                                  </div>
                                </CollapsibleContent>
                              )}
                            </Collapsible>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })()}
          </div>
        </Card>

        {/* Meta Information */}
        <Card className="p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Meta Informatie
          </h3>

          <div className="space-y-4">
            {data.meta.title && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Title Tag
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lengte: {data.meta.title.length} karakters {data.meta.title.length > 60 && "(⚠️ Te lang)"}
                </p>
              </div>
            )}

            {data.meta.description && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Meta Description
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Lengte: {data.meta.description.length} karakters {data.meta.description.length > 160 && "(⚠️ Te lang)"}
                </p>
              </div>
            )}

            {data.meta.ogTitle && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Open Graph Title
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.ogTitle}
                </p>
              </div>
            )}

            {data.meta.ogDescription && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Open Graph Description
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.ogDescription}
                </p>
              </div>
            )}

            {data.meta.ogImage && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Open Graph Image
                </label>
                <img 
                  src={data.meta.ogImage} 
                  alt="OG Image" 
                  className="mt-2 rounded-lg border border-border max-w-full h-auto"
                />
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Structured Data Analysis */}
      <StructuredDataAnalysis structuredData={data.structuredData} url={data.url} />

      {/* FAQ Suggestions */}
      {data.faqs && data.faqs.length > 0 && (
        <FaqSuggestions faqs={data.faqs} />
      )}

      {/* JSON-LD Generator */}
      <JsonLdGenerator url={data.url} meta={data.meta} headings={data.headings} faqs={data.faqs} />

      {/* Placeholder Cards for DR/UR and Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6 shadow-soft bg-gradient-to-br from-card to-secondary/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Domain & URL Rating
          </h3>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              DR/UR data vereist externe API integratie
            </p>
            <p className="text-sm text-muted-foreground">
              (Ahrefs, Moz, of SEMrush)
            </p>
            <div className="mt-6 flex gap-4 justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">--</div>
                <div className="text-xs text-muted-foreground mt-1">Domain Rating</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">--</div>
                <div className="text-xs text-muted-foreground mt-1">URL Rating</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6 shadow-soft bg-gradient-to-br from-card to-secondary/20">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            Keyword Rankings
          </h3>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              Keyword ranking data vereist externe API integratie
            </p>
            <p className="text-sm text-muted-foreground">
              (Google Search Console, Ahrefs, of SEMrush)
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
