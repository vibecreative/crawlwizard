export interface HeadingInfo {
  level: number;
  text: string;
  position: { top: number; left: number };
  content?: string;
}

export interface StructuredDataItem {
  type: string;
  data: any;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface KeywordScore {
  keyword: string;
  density: number;
  count: number;
  relevance: number;
  suggestions?: string[];
}

export interface KeywordPlacementAnalysis {
  keyword: string;
  inUrl: boolean;
  inH1: boolean;
  inIntroText: boolean;
  url: string;
  h1Text?: string;
  introText?: string;
}

export interface AnalysisData {
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
  keywords?: KeywordScore[];
  keywordPlacement?: KeywordPlacementAnalysis;
}
