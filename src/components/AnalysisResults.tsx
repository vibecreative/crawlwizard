import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ExternalLink, FileText, Hash, TrendingUp, RotateCcw, ChevronDown, RefreshCw, Loader2, Lock, ArrowUpRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { HeadingStructureScore } from "./HeadingStructureScore";
import { StructuredDataAnalysis } from "./StructuredDataAnalysis";
import { JsonLdGenerator } from "./JsonLdGenerator";
import { FaqSuggestions } from "./FaqSuggestions";
import { KeywordAnalysis } from "./KeywordAnalysis";
import { KeywordPlacementAdvice } from "./KeywordPlacementAdvice";
import { AiRankingCheck } from "./AiRankingCheck";
import { AiCreditsDisplay } from "./AiCreditsDisplay";
import { MetaTagSuggestions } from "./MetaTagSuggestions";
import { useAiCredits } from "@/hooks/useAiCredits";
import type { AnalysisData, FaqItem, HeadingInfo } from "@/types/analysis";

interface AnalysisResultsProps {
  data: AnalysisData;
  onReset: () => void;
  onFaqsUpdate?: (updatedFaqs: FaqItem[]) => void;
  onReanalyze?: () => void;
  isReanalyzing?: boolean;
  onGenerateFaqs?: () => Promise<void>;
  isGeneratingFaqs?: boolean;
  userPlan?: string;
  pageId?: string;
  userId?: string;
  brandContext?: string;
}

const LockedFeatureCard = ({ title, description, onUpgrade, upgradeLabel }: { title: string; description: string; onUpgrade: () => void; upgradeLabel: string }) => (
  <Card className="p-4 sm:p-6 shadow-soft border-dashed border-2 border-muted-foreground/20 bg-muted/30 relative overflow-hidden">
    <div className="flex flex-col sm:flex-row sm:items-start gap-3 sm:justify-between">
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-lg bg-muted shrink-0">
          <Lock className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-muted-foreground">{title}</h3>
          <p className="text-xs sm:text-sm text-muted-foreground/70 mt-1 max-w-lg">{description}</p>
        </div>
      </div>
      <Button
        variant="outline"
        size="sm"
        className="shrink-0 gap-1.5 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground self-start sm:self-auto"
        onClick={onUpgrade}
      >
        {upgradeLabel}
        <ArrowUpRight className="h-3.5 w-3.5" />
      </Button>
    </div>
  </Card>
);

export const AnalysisResults = ({
  data, 
  onReset, 
  onFaqsUpdate, 
  onReanalyze, 
  isReanalyzing,
  onGenerateFaqs,
  isGeneratingFaqs,
  userPlan,
  pageId,
  userId,
  brandContext
}: AnalysisResultsProps) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isFree = userPlan === 'free';
  const { credits, isLoading: creditsLoading, refetchCredits } = useAiCredits(userId);
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="p-2.5 sm:p-3 rounded-xl gradient-primary shrink-0">
            <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
          </div>
          <div className="min-w-0">
            <h2 className="text-xl sm:text-2xl font-bold">{t('analysis.analysisResults')}</h2>
            <a 
              href={data.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs sm:text-sm text-muted-foreground hover:text-accent flex items-center gap-1 mt-1 truncate"
            >
              <span className="truncate">{data.url}</span>
              <ExternalLink className="h-3 w-3 shrink-0" />
            </a>
          </div>
        </div>
        <div className="flex gap-2 shrink-0">
          {onReanalyze && (
            <Button 
              onClick={onReanalyze}
              disabled={isReanalyzing}
              className="gap-2 gradient-primary text-sm"
              size="sm"
            >
              {isReanalyzing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="hidden sm:inline">{t('analysis.reanalyzing')}</span>
                  <span className="sm:hidden">{t('analysis.reanalyzingShort')}</span>
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('analysis.reanalyze')}</span>
                  <span className="sm:hidden">{t('analysis.reanalyzeShort')}</span>
                </>
              )}
            </Button>
          )}
          {!onReanalyze && (
            <Button 
              onClick={onReset}
              variant="outline"
              className="gap-2"
              size="sm"
            >
              <RotateCcw className="h-4 w-4" />
              <span className="hidden sm:inline">{t('analysis.newAnalysis')}</span>
              <span className="sm:hidden">{t('analysis.newShort')}</span>
            </Button>
          )}
        </div>
      </div>

      {/* AI Credits Display */}
      <AiCreditsDisplay credits={credits} isLoading={creditsLoading} />

      {/* SEO Score - Prominent at top */}
      <HeadingStructureScore headings={data.headings} meta={data.meta} structuredData={data.structuredData} />

      {/* Visual Screenshot with Heading Markers */}
      {data.screenshot && (
        <Card className="p-6 shadow-soft">
          <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            {t('analysis.headingStructureVisualization')}
          </h3>
          <div className="relative inline-block max-w-full">
            <img 
              src={data.screenshot} 
              alt="Website screenshot" 
              className="rounded-lg border border-border w-full"
            />
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Heading Structure */}
        <Card className="p-4 sm:p-6 shadow-soft flex flex-col lg:h-0 lg:min-h-full overflow-hidden">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            {t('analysis.headingStructure')}
          </h3>
          
          <div className="space-y-3 mb-6 shrink-0">
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

          <div className="space-y-4 min-h-0 flex-1 overflow-y-auto">
            {(() => {
              const sortedHeadings = [...data.headings].sort((a, b) => a.position.top - b.position.top);
              
              const groups: Array<{ h2?: HeadingInfo; children: HeadingInfo[] }> = [];
              let currentGroup: { h2?: HeadingInfo; children: HeadingInfo[] } | null = null;
              
              sortedHeadings.forEach((heading) => {
                if (heading.level === 1) {
                  if (currentGroup && (currentGroup.h2 || currentGroup.children.length > 0)) {
                    groups.push(currentGroup);
                  }
                  groups.push({ children: [heading] });
                  currentGroup = null;
                } else if (heading.level === 2) {
                  if (currentGroup && (currentGroup.h2 || currentGroup.children.length > 0)) {
                    groups.push(currentGroup);
                  }
                  currentGroup = { h2: heading, children: [] };
                } else {
                  if (!currentGroup) {
                    currentGroup = { children: [heading] };
                  } else {
                    currentGroup.children.push(heading);
                  }
                }
              });
              
              if (currentGroup && (currentGroup.h2 || currentGroup.children.length > 0)) {
                groups.push(currentGroup);
              }
              
              return groups.map((group, groupIdx) => {
                if (group.children.length === 1 && group.children[0].level === 1) {
                  const h1 = group.children[0];
                  return (
                    <Collapsible key={`h1-${groupIdx}`}>
                      <CollapsibleTrigger className="w-full">
                        <div className="flex items-start gap-3 p-3 rounded-lg bg-primary/10 border-2 border-primary/30 hover:bg-primary/15 transition-colors group">
                          <Badge className={`${getHeadingColor(1)} text-white shrink-0`}>
                            H1
                          </Badge>
                          <p className="text-sm flex-1 font-semibold text-left">{h1.text}</p>
                          {h1.content && (
                            <ChevronDown className="h-4 w-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                          )}
                        </div>
                      </CollapsibleTrigger>
                      {h1.content && (
                        <CollapsibleContent className="mt-2">
                          <div className="text-xs text-muted-foreground p-3 rounded-md bg-background/50 whitespace-pre-wrap ml-2 border-l-2 border-primary/30">
                            {h1.content}
                          </div>
                        </CollapsibleContent>
                      )}
                    </Collapsible>
                  );
                }
                
                if (!group.h2) return null;
                
                return (
                  <div key={`group-${groupIdx}`} className="border border-border/50 rounded-lg p-3 bg-secondary/20">
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
                    
                    {group.children.length > 0 && (
                      <div className="ml-4 space-y-2 mt-2">
                        {group.children.map((child, childIdx) => {
                          const indentLevel = Math.max(0, child.level - 3);
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
        <Card className="p-4 sm:p-6 shadow-soft">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t('analysis.metaInformation')}
          </h3>

          {!isFree && (
            <MetaTagSuggestions
              url={data.url}
              pageContent={data.html}
              currentMeta={data.meta}
              onCreditsUsed={refetchCredits}
            />
          )}

          <div className="space-y-4">
            {data.meta.title && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('analysis.titleTag')}
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.title}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('analysis.length')}: {data.meta.title.length} {t('analysis.characters')} {data.meta.title.length > 60 && `(⚠️ ${t('analysis.tooLong')})`}
                </p>
              </div>
            )}

            {data.meta.description && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('analysis.metaDescription')}
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.description}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t('analysis.length')}: {data.meta.description.length} {t('analysis.characters')} {data.meta.description.length > 160 && `(⚠️ ${t('analysis.tooLong')})`}
                </p>
              </div>
            )}

            {data.meta.ogTitle && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('analysis.ogTitle')}
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.ogTitle}
                </p>
              </div>
            )}

            {data.meta.ogDescription && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('analysis.ogDescription')}
                </label>
                <p className="mt-1 text-sm p-3 bg-secondary rounded-lg">
                  {data.meta.ogDescription}
                </p>
              </div>
            )}

            {data.meta.ogImage && (
              <div>
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  {t('analysis.ogImage')}
                </label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Ideaal formaat: 1200 × 630 pixels
                </p>
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

      {/* Structured Data Analysis - Scale+ */}
      {!isFree ? (
        <StructuredDataAnalysis structuredData={data.structuredData} url={data.url} />
      ) : (
        <LockedFeatureCard 
          title={t('analysis.richSnippets')} 
          description={t('analysis.lockedStructuredData')}
          onUpgrade={() => navigate('/#pricing')}
          upgradeLabel={t('analysis.upgrade')}
        />
      )}

      {/* JSON-LD Generator - Scale+ */}
      {!isFree ? (
        <JsonLdGenerator url={data.url} meta={data.meta} headings={data.headings} faqs={data.faqs} />
      ) : (
        <LockedFeatureCard 
          title={t('jsonLd.title')} 
          description={t('analysis.lockedJsonLd')}
          onUpgrade={() => navigate('/#pricing')}
          upgradeLabel={t('analysis.upgrade')}
        />
      )}

      {/* Keyword Placement Advice - Scale+ */}
      {!isFree ? (
        data.keywordPlacement && <KeywordPlacementAdvice analysis={data.keywordPlacement} />
      ) : (
        <LockedFeatureCard 
          title={t('keywordPlacement.title')} 
          description={t('analysis.lockedKeywordPlacement')}
          onUpgrade={() => navigate('/#pricing')}
          upgradeLabel={t('analysis.upgrade')}
        />
      )}

      {/* Keyword Analysis - Scale+ */}
      {!isFree ? (
        data.keywords && data.keywords.length > 0 && <KeywordAnalysis keywords={data.keywords} />
      ) : (
        <LockedFeatureCard 
          title={t('keyword.title')} 
          description={t('analysis.lockedKeywordAnalysis')}
          onUpgrade={() => navigate('/#pricing')}
          upgradeLabel={t('analysis.upgrade')}
        />
      )}

      {/* FAQ Suggestions - Scale+ */}
      {!isFree ? (
        <FaqSuggestions 
          faqs={data.faqs || []} 
          websiteUrl={data.url}
          pageContent={data.html}
          onFaqsUpdate={onFaqsUpdate}
          onGenerateFaqs={onGenerateFaqs}
          isGeneratingFaqs={isGeneratingFaqs}
          userPlan={userPlan}
          brandContext={brandContext}
        />
      ) : (
        <LockedFeatureCard 
          title={t('faq.title')} 
          description={t('analysis.lockedFaq')}
          onUpgrade={() => navigate('/#pricing')}
          upgradeLabel={t('analysis.upgrade')}
        />
      )}

      {/* AI Ranking Check - Enterprise */}
      {userPlan === 'enterprise' ? (
        <AiRankingCheck
          pageId={pageId || ""}
          domain={(() => { try { return new URL(data.url).hostname; } catch { return data.url; } })()}
          faqs={data.faqs}
          userPlan={userPlan}
        />
      ) : (
        <LockedFeatureCard 
          title={t('aiRanking.title')} 
          description={t('analysis.lockedAiRanking')}
          onUpgrade={() => navigate('/#pricing')}
          upgradeLabel={t('analysis.upgrade')}
        />
      )}

      {/* Placeholder Cards for DR/UR and Keywords */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="p-4 sm:p-6 shadow-soft bg-gradient-to-br from-card to-secondary/20">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            {t('analysis.domainUrlRating')}
          </h3>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              {t('analysis.drUrRequiresApi')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('analysis.drUrApis')}
            </p>
            <div className="mt-6 flex gap-4 justify-center">
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">--</div>
                <div className="text-xs text-muted-foreground mt-1">{t('analysis.domainRating')}</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold gradient-text">--</div>
                <div className="text-xs text-muted-foreground mt-1">{t('analysis.urlRating')}</div>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-4 sm:p-6 shadow-soft bg-gradient-to-br from-card to-secondary/20">
          <h3 className="text-lg sm:text-xl font-semibold mb-4 flex items-center gap-2">
            <Hash className="h-5 w-5 text-primary" />
            {t('analysis.keywordRankings')}
          </h3>
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-2">
              {t('analysis.keywordRankingsRequiresApi')}
            </p>
            <p className="text-sm text-muted-foreground">
              {t('analysis.keywordRankingsApis')}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};
