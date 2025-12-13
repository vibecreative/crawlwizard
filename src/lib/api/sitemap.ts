import { supabase } from '@/integrations/supabase/client';

export interface SitemapUrl {
  loc: string;
  lastmod?: string;
  priority?: string;
}

export interface SitemapResponse {
  success: boolean;
  urls?: SitemapUrl[];
  totalFound?: number;
  sitemapPath?: string;
  error?: string;
  triedPaths?: string[];
}

export const sitemapApi = {
  async parseSitemap(baseUrl: string): Promise<SitemapResponse> {
    const { data, error } = await supabase.functions.invoke('parse-sitemap', {
      body: { baseUrl },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return data;
  },
};
