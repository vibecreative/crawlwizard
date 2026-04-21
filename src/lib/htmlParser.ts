import type {
  HeadingInfo,
  StructuredDataItem,
  KeywordScore,
  KeywordPlacementAnalysis,
} from "@/types/analysis";
import { supabase } from "@/integrations/supabase/client";

// ── Heading Parsing ──────────────────────────────────────────────────────────

const escapeRegExp = (value: string): string =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const parseHeadings = (html: string): HeadingInfo[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const headings: HeadingInfo[] = [];

  const headingElements = Array.from(
    doc.querySelectorAll("h1, h2, h3, h4, h5, h6")
  );
  const allElements = Array.from(doc.body.querySelectorAll("*"));

  headingElements.forEach((el, index) => {
    const tagName = el.tagName.toLowerCase();
    const level = parseInt(tagName.substring(1));
    const text = el.textContent?.trim() || "";

    if (!text) return;

    const style = el.getAttribute("style") || "";
    const isHidden =
      el.getAttribute("hide") === "true" ||
      style.includes("display: none") ||
      style.includes("display:none") ||
      style.includes("visibility: hidden") ||
      style.includes("visibility:hidden") ||
      el.getAttribute("aria-hidden") === "true" ||
      (el.getAttribute("class") || "").includes("hidden") ||
      (el.getAttribute("class") || "").includes("sr-only");

    if (isHidden) return;

    let content = "";
    const headingIndex = allElements.indexOf(el);
    const nextHeadingIndex = headingElements
      .slice(index + 1)
      .map((h) => allElements.indexOf(h))
      .find((idx) => idx > headingIndex);

    const contentElements: string[] = [];
    const seenTexts = new Set<string>();

    for (
      let i = headingIndex + 1;
      i < (nextHeadingIndex || allElements.length);
      i++
    ) {
      const element = allElements[i];

      if (element.matches("h1, h2, h3, h4, h5, h6")) break;

      // Skip containers that include a (next) heading — their textContent
      // would "swallow" that next section.
      if (element.querySelector("h1, h2, h3, h4, h5, h6")) continue;

      const isLeafElement = !element.querySelector(
        "p, div, span, li, td, th, a, button, h1, h2, h3, h4, h5, h6"
      );

      if (
        element.matches("p, li, td, th, a, button") ||
        (element.matches("div, span") && isLeafElement)
      ) {
        const elementText = element.textContent?.trim() || "";
        if (!elementText || elementText.length <= 10) continue;

        // Remove exact heading text from the start of content blocks to avoid
        // duplication. Use an explicit startsWith check first, then fall back
        // to a regex approach for minor whitespace differences.
        let cleanedText = elementText;
        if (cleanedText.toLowerCase().startsWith(text.toLowerCase())) {
          cleanedText = cleanedText.slice(text.length).trim();
        } else {
          const headingPrefixRe = new RegExp(
            `^\\s*${escapeRegExp(text)}\\s*`,
            "i"
          );
          cleanedText = elementText.replace(headingPrefixRe, "").trim();
        }
        if (!cleanedText || cleanedText.length <= 10) continue;

        if (!seenTexts.has(cleanedText)) {
          const hasOverlap = contentElements.some(
            (existing) =>
              existing.includes(cleanedText) || cleanedText.includes(existing)
          );

          if (!hasOverlap) {
            contentElements.push(cleanedText);
            seenTexts.add(cleanedText);
          }
        }
      }
    }

    content = contentElements.join("\n\n");

    headings.push({
      level,
      text,
      position: { top: index, left: 0 },
      content: content.trim() || undefined,
    });
  });

  return headings;
};

// ── Meta Parsing ─────────────────────────────────────────────────────────────

export const parseMeta = (html: string) => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const getMetaContent = (selector: string) => {
    const element = doc.querySelector(selector);
    return element?.getAttribute("content") || undefined;
  };

  const titleElement = doc.querySelector("title");
  const rawTitle = titleElement?.textContent?.trim() || undefined;

  return {
    title: rawTitle,
    description: getMetaContent('meta[name="description"]'),
    ogTitle: getMetaContent('meta[property="og:title"]'),
    ogDescription: getMetaContent('meta[property="og:description"]'),
    ogImage: getMetaContent('meta[property="og:image"]'),
  };
};

// ── Structured Data Parsing ──────────────────────────────────────────────────

export const parseStructuredData = (html: string): StructuredDataItem[] => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const typeMap = new Map<string, any>();

  const jsonLdScripts = doc.querySelectorAll(
    'script[type="application/ld+json"]'
  );

  jsonLdScripts.forEach((script) => {
    try {
      const data = JSON.parse(script.textContent || "");

      const extractTypes = (obj: any, depth = 0): void => {
        if (Array.isArray(obj)) {
          obj.forEach((item) => extractTypes(item, depth));
        } else if (obj && typeof obj === "object") {
          if (obj["@graph"] && Array.isArray(obj["@graph"]) && depth === 0) {
            obj["@graph"].forEach((item: any) =>
              extractTypes(item, depth + 1)
            );
          } else if (obj["@type"]) {
            const types = Array.isArray(obj["@type"])
              ? obj["@type"]
              : [obj["@type"]];
            types.forEach((type: string) => {
              const typeLabel = `JSON-LD: ${type}`;
              if (!typeMap.has(typeLabel)) {
                typeMap.set(typeLabel, obj);
              }
            });
          }
        }
      };

      extractTypes(data);
    } catch (e) {
      console.error("Failed to parse JSON-LD:", e);
    }
  });

  const structuredData: StructuredDataItem[] = Array.from(
    typeMap.entries()
  ).map(([type, data]) => ({ type, data }));

  const itemScopes = doc.querySelectorAll("[itemscope]");
  const microdataTypes = new Set<string>();
  itemScopes.forEach((element) => {
    const itemType = element.getAttribute("itemtype");
    if (itemType) {
      microdataTypes.add(itemType.split("/").pop() || "Unknown");
    }
  });

  if (microdataTypes.size > 0) {
    structuredData.push({
      type: "Microdata",
      data: Array.from(microdataTypes),
    });
  }

  return structuredData;
};

// ── Keyword Analysis ─────────────────────────────────────────────────────────

export const analyzeKeywords = (
  html: string,
  keywords: string[]
): KeywordScore[] => {
  if (keywords.length === 0) return [];

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const bodyText = doc.body.textContent?.toLowerCase() || "";
  const words = bodyText.split(/\s+/).filter((w) => w.length > 0);
  const totalWords = words.length;

  return keywords.map((keyword) => {
    const keywordLower = keyword.toLowerCase();
    const regex = new RegExp(`\\b${keywordLower}\\b`, "gi");
    const matches = bodyText.match(regex) || [];
    const count = matches.length;
    const density = totalWords > 0 ? (count / totalWords) * 100 : 0;

    const title = doc.querySelector("title");
    const inTitle =
      title?.textContent?.toLowerCase().includes(keywordLower) || false;

    const metaDesc = doc.querySelector('meta[name="description"]');
    const inMetaDesc =
      metaDesc
        ?.getAttribute("content")
        ?.toLowerCase()
        .includes(keywordLower) || false;

    const h1Elements = doc.querySelectorAll("h1");
    const inH1 = Array.from(h1Elements).some((h) =>
      h.textContent?.toLowerCase().includes(keywordLower)
    );

    const h2Elements = doc.querySelectorAll("h2");
    const inH2 = Array.from(h2Elements).some((h) =>
      h.textContent?.toLowerCase().includes(keywordLower)
    );

    let relevanceScore = 0;
    if (inTitle) relevanceScore += 25;
    if (inMetaDesc) relevanceScore += 15;
    if (inH1) relevanceScore += 20;
    if (inH2) relevanceScore += 10;
    relevanceScore += Math.min(count * 2, 30);

    const suggestions: string[] = [];

    if (!inTitle)
      suggestions.push(
        `Voeg "${keyword}" toe aan de title tag voor betere vindbaarheid`
      );
    if (!inMetaDesc)
      suggestions.push(
        `Voeg "${keyword}" toe aan de meta description`
      );
    if (!inH1)
      suggestions.push(
        `Gebruik "${keyword}" in minimaal één H1 heading`
      );

    if (density > 3) {
      suggestions.push(
        `Verlaag de keyword density (nu ${density.toFixed(2)}%) om keyword stuffing te voorkomen`
      );
    } else if (density < 1 && count > 0) {
      suggestions.push(
        `Overweeg "${keyword}" vaker te gebruiken in de content (huidige density: ${density.toFixed(2)}%)`
      );
    } else if (count === 0) {
      suggestions.push(
        `Dit keyword komt niet voor op de pagina. Voeg relevante content toe met "${keyword}"`
      );
    }

    if (!inH2 && count > 0) {
      suggestions.push(
        `Versterk de structuur door "${keyword}" ook in H2 headings te gebruiken`
      );
    }

    return {
      keyword,
      density,
      count,
      relevance: Math.min(relevanceScore, 100),
      suggestions: suggestions.length > 0 ? suggestions : undefined,
    };
  });
};

// ── Keyword Placement Analysis ───────────────────────────────────────────────

const DUTCH_STOPWORDS = [
  "in", "de", "het", "een", "van", "en", "op", "te", "voor", "met", "naar",
  "aan", "om", "bij",
];

const normalizeForMatching = (text: string): string =>
  text
    .toLowerCase()
    .replace(/[^\w\s]/g, "")
    .split(/\s+/)
    .filter((word) => !DUTCH_STOPWORDS.includes(word))
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();

const fuzzyKeywordMatch = (text: string, keyword: string): boolean => {
  const normalizedText = normalizeForMatching(text);
  const normalizedKeyword = normalizeForMatching(keyword);

  if (normalizedText.includes(normalizedKeyword)) return true;

  const textNoSpaces = normalizedText.replace(/\s/g, "");
  const keywordNoSpaces = normalizedKeyword.replace(/\s/g, "");
  if (textNoSpaces.includes(keywordNoSpaces)) return true;

  const keywordParts = normalizedKeyword
    .split(" ")
    .filter((p) => p.length > 2);
  if (keywordParts.length === 0) return false;

  const textWords = normalizedText.split(" ");
  return keywordParts.every((part) => {
    const foundInWord = textWords.some((word) => word.includes(part));
    const foundInContinuous = textNoSpaces.includes(part);
    return foundInWord || foundInContinuous;
  });
};

export const analyzeKeywordPlacement = (
  html: string,
  url: string,
  primaryKeyword: string
): KeywordPlacementAnalysis | undefined => {
  if (!primaryKeyword) return undefined;

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const urlLower = url.toLowerCase();
  const keywordForUrl = primaryKeyword.toLowerCase().replace(/\s+/g, "-");
  const keywordNoSpaces = primaryKeyword.toLowerCase().replace(/\s+/g, "");
  const inUrl =
    urlLower.includes(keywordForUrl) ||
    urlLower.includes(keywordNoSpaces) ||
    fuzzyKeywordMatch(urlLower.replace(/-/g, " "), primaryKeyword);

  const h1Element = doc.querySelector("h1");
  const h1Text = h1Element?.textContent?.trim() || "";
  const inH1 = fuzzyKeywordMatch(h1Text, primaryKeyword);

  let introText = "";
  if (h1Element) {
    const introTexts: string[] = [];

    // Strategy 1: Direct siblings of H1
    let sibling = h1Element.nextElementSibling;
    let elementsChecked = 0;

    while (sibling && elementsChecked < 15) {
      if (sibling.matches("h1, h2, h3, h4, h5, h6")) break;

      if (sibling.matches("p, div, span, section, article")) {
        const text = sibling.textContent?.trim() || "";
        if (text.length > 20) {
          introTexts.push(text);
          if (introTexts.join(" ").length > 300) break;
        }
      }

      sibling = sibling.nextElementSibling;
      elementsChecked++;
    }

    // Strategy 2: Parent's next siblings (H1 is in a container like <header>)
    if (introTexts.length === 0 && h1Element.parentElement) {
      const parent = h1Element.parentElement;
      const children = Array.from(parent.children);
      const h1Index = children.indexOf(h1Element);

      for (
        let i = h1Index + 1;
        i < Math.min(h1Index + 10, children.length);
        i++
      ) {
        const child = children[i];
        if (child.matches("h1, h2, h3, h4, h5, h6")) break;

        const text = child.textContent?.trim() || "";
        if (text.length > 20) {
          introTexts.push(text);
          if (introTexts.join(" ").length > 300) break;
        }
      }
    }

    // Strategy 3: Walk up to find next section/container after H1's container
    if (introTexts.length === 0) {
      let container: Element | null = h1Element.parentElement;
      while (container && introTexts.length === 0) {
        let nextContainer = container.nextElementSibling;
        let containerChecks = 0;

        while (nextContainer && containerChecks < 5) {
          if (nextContainer.matches("h1, h2, h3, h4, h5, h6")) break;

          const text = nextContainer.textContent?.trim() || "";
          if (text.length > 20) {
            introTexts.push(text);
            if (introTexts.join(" ").length > 300) break;
          }

          nextContainer = nextContainer.nextElementSibling;
          containerChecks++;
        }

        if (
          introTexts.length === 0 &&
          container.parentElement &&
          container.parentElement !== doc.body
        ) {
          container = container.parentElement;
        } else {
          break;
        }
      }
    }

    // Strategy 4: TreeWalker as last resort
    if (introTexts.length === 0) {
      const walker = doc.createTreeWalker(
        doc.body,
        NodeFilter.SHOW_ELEMENT,
        null
      );

      let foundH1 = false;
      let elementsAfterH1 = 0;

      while (walker.nextNode()) {
        const node = walker.currentNode as Element;

        if (node === h1Element) {
          foundH1 = true;
          continue;
        }

        if (foundH1) {
          if (node.matches("h1, h2, h3, h4, h5, h6")) break;

          if (
            node.matches("p") &&
            !node.closest("nav, header, footer, aside")
          ) {
            const text = node.textContent?.trim() || "";
            if (text.length > 30) {
              introTexts.push(text);
              if (introTexts.join(" ").length > 300) break;
            }
          }

          elementsAfterH1++;
          if (elementsAfterH1 > 100) break;
        }
      }
    }

    introText = introTexts.join(" ").substring(0, 500);
  }

  const inIntroText =
    introText.length > 0 && fuzzyKeywordMatch(introText, primaryKeyword);

  return {
    keyword: primaryKeyword,
    inUrl,
    inH1,
    inIntroText,
    url,
    h1Text: h1Text || undefined,
    introText: introText || undefined,
  };
};

// ── SEO Score Calculation ────────────────────────────────────────────────────
// Mirrors the logic in HeadingStructureScore.tsx so the dashboard overview
// and the detail page show the exact same number.

interface ScoreMeta {
  title?: string;
  description?: string;
}

interface ScoreStructuredItem {
  type: string;
}

export const calculatePageStructureScore = (
  headings: HeadingInfo[],
  meta?: ScoreMeta,
  structuredData?: ScoreStructuredItem[]
): number => {
  let score = 100;

  const counts = headings.reduce((acc, h) => {
    acc[h.level] = (acc[h.level] || 0) + 1;
    return acc;
  }, {} as Record<number, number>);

  // H1
  const h1Count = counts[1] || 0;
  if (h1Count === 0) score -= 15;
  else if (h1Count > 1) score -= 10;

  // Hierarchy gaps (skipped levels)
  const usedLevels = Object.keys(counts).map(Number).sort((a, b) => a - b);
  let previousLevel = 0;
  let hierarchyIssues = 0;
  for (const level of usedLevels) {
    if (previousLevel > 0 && level > previousLevel + 1) hierarchyIssues++;
    previousLevel = level;
  }
  score -= Math.min(hierarchyIssues * 5, 10);

  // Total headings
  const totalHeadings = headings.length;
  if (totalHeadings === 0) score -= 10;
  else if (totalHeadings < 3) score -= 5;

  // H2 presence
  const h2Count = counts[2] || 0;
  if (h2Count === 0 && totalHeadings > 1) score -= 5;

  // Meta
  if (meta) {
    if (!meta.title) score -= 15;
    else if (meta.title.length > 60) score -= 5;

    if (!meta.description) score -= 15;
    else if (meta.description.length > 160) score -= 5;
  } else {
    score -= 15;
  }

  // Structured data
  if (!structuredData || structuredData.length === 0) {
    score -= 30;
  } else {
    const types = structuredData.map((s) => s.type.toLowerCase());
    const hasWebsite = types.some((t) => t.includes("website"));
    const hasBreadcrumb = types.some((t) => t.includes("breadcrumb"));
    if (!hasWebsite) score -= 5;
    if (!hasBreadcrumb) score -= 5;
  }

  return Math.max(0, Math.min(100, score));
};

// Backwards-compatible alias used by existing call sites.
export const calculateSeoScore = (
  hasH1: boolean,
  hasMetaDesc: boolean,
  hasStructuredData: boolean,
  headingIssues: number,
  headings?: HeadingInfo[],
  meta?: ScoreMeta,
  structuredData?: ScoreStructuredItem[]
): number => {
  if (headings) {
    return calculatePageStructureScore(headings, meta, structuredData);
  }
  // Fallback (legacy callers without full data)
  let score = 0;
  if (hasH1) score += 25;
  if (hasMetaDesc) score += 25;
  if (hasStructuredData) score += 25;
  score += Math.max(0, 25 - headingIssues * 5);
  return Math.max(0, Math.min(100, score));
};

// ── Heading Issues Calculation ───────────────────────────────────────────────

export const calculateHeadingIssues = (headings: HeadingInfo[]): number => {
  let issues = 0;
  const h1Count = headings.filter((h) => h.level === 1).length;
  if (h1Count === 0) issues++;
  if (h1Count > 1) issues++;

  const levels = headings.map((h) => h.level).sort((a, b) => a - b);
  for (let i = 1; i < levels.length; i++) {
    if (levels[i] - levels[i - 1] > 1) issues++;
  }
  return issues;
};

// ── Page Fetching ────────────────────────────────────────────────────────────

export const fetchPageHtml = async (url: string): Promise<string> => {
  const { data, error } = await supabase.functions.invoke("fetch-page", {
    body: { url },
  });

  if (error) {
    console.error("Edge function error:", error);
    throw new Error(
      "Kon de website niet ophalen. Probeer het later opnieuw."
    );
  }

  if (!data?.success || !data?.html) {
    throw new Error(data?.error || "Geen HTML ontvangen van de server");
  }

  return data.html;
};

/**
 * Fetch with CORS proxy fallback — used by PageDetails for re-analysis
 * when the edge function is not needed.
 */
export const fetchWithCorsRetry = async (
  url: string,
  maxRetries = 3
): Promise<string> => {
  const corsProxies = [
    (u: string) =>
      `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
    (u: string) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
    (u: string) =>
      `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(u)}`,
  ];

  const errorPatterns = [
    /^<!DOCTYPE[^>]*>\s*<html[^>]*>\s*<head>\s*<title>\s*403\s*(Forbidden)?/i,
    /^<!DOCTYPE[^>]*>\s*<html[^>]*>\s*<head>\s*<title>\s*404\s*(Not Found)?/i,
    /^<!DOCTYPE[^>]*>\s*<html[^>]*>\s*<head>\s*<title>\s*502\s*(Bad Gateway)?/i,
    /^<!DOCTYPE[^>]*>\s*<html[^>]*>\s*<head>\s*<title>\s*503\s*(Service Unavailable)?/i,
    /^<!DOCTYPE[^>]*>\s*<html[^>]*>\s*<head>\s*<title>\s*Access Denied/i,
    /<title>\s*Error\s*<\/title>/i,
    /<h1>\s*403\s*(Forbidden)?\s*<\/h1>/i,
    /<h1>\s*404\s*(Not Found)?\s*<\/h1>/i,
    /<h1>\s*Access Denied\s*<\/h1>/i,
  ];

  const isErrorPage = (html: string): boolean => {
    for (const pattern of errorPatterns) {
      if (pattern.test(html)) return true;
    }
    if (html.length < 2000) {
      const lower = html.toLowerCase();
      if (
        (lower.includes("403") && lower.includes("forbidden")) ||
        (lower.includes("404") && lower.includes("not found")) ||
        lower.includes("access denied") ||
        (lower.includes("error") && !lower.includes("<article"))
      ) {
        return true;
      }
    }
    return false;
  };

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    for (const proxyFn of corsProxies) {
      try {
        const proxyUrl = proxyFn(url);
        const response = await fetch(proxyUrl, {
          signal: AbortSignal.timeout(15000),
        });

        if (response.ok) {
          const html = await response.text();
          if (html && html.length > 100 && !isErrorPage(html)) {
            return html;
          } else if (isErrorPage(html)) {
            lastError = new Error("Proxy returned error page");
            continue;
          }
        }
      } catch (error) {
        lastError = error as Error;
      }
    }

    if (attempt < maxRetries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }

  throw (
    lastError ||
    new Error("Kon de website niet ophalen na meerdere pogingen")
  );
};
