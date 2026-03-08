import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface CreditInfo {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
}

export function useAiCredits(userId?: string) {
  const [credits, setCredits] = useState<CreditInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchCredits = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_remaining_credits', { _user_id: userId });
      if (error) throw error;
      const parsed = typeof data === 'string' ? JSON.parse(data) : data;
      setCredits(parsed);
    } catch (err) {
      console.error('Error fetching credits:', err);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCredits();
  }, [fetchCredits]);

  return { credits, isLoading, refetchCredits: fetchCredits };
}
