import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAiCredits } from "@/hooks/useAiCredits";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Zap, TrendingUp, Calendar, Activity } from "lucide-react";

interface CreditUsageRow {
  action_type: string;
  credits_used: number;
  created_at: string;
}

interface DayData {
  date: string;
  label: string;
  credits: number;
}

interface CreditsDashboardProps {
  userId: string;
}

export const CreditsDashboard = ({ userId }: CreditsDashboardProps) => {
  const { t, i18n } = useTranslation();
  const { credits, isLoading: creditsLoading } = useAiCredits(userId);
  const [usageData, setUsageData] = useState<CreditUsageRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month">("week");

  const ACTION_LABELS: Record<string, string> = {
    faq_analysis: "FAQ " + t('faq.analyze'),
    faq_generation: "FAQ " + t('faq.generateButton').split(' ')[0],
    faq_regeneration: "FAQ " + t('faq.regenerate'),
    ai_ranking_check: t('aiRanking.title'),
    article_generation: t('article.title'),
  };

  const ACTION_COLORS: Record<string, string> = {
    faq_analysis: "hsl(var(--primary))",
    faq_generation: "hsl(var(--accent))",
    faq_regeneration: "hsl(142, 76%, 36%)",
    ai_ranking_check: "hsl(262, 83%, 58%)",
    article_generation: "hsl(25, 95%, 53%)",
  };

  useEffect(() => {
    fetchUsageData();
  }, [userId]);

  const fetchUsageData = async () => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { data, error } = await supabase
        .from("ai_credit_usage")
        .select("action_type, credits_used, created_at")
        .eq("user_id", userId)
        .gte("created_at", thirtyDaysAgo.toISOString())
        .order("created_at", { ascending: true });

      if (error) throw error;
      setUsageData(data || []);
    } catch (err) {
      console.error("Error fetching credit usage:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDailyData = (): DayData[] => {
    const days = period === "week" ? 7 : 30;
    const result: DayData[] = [];
    const now = new Date();
    const locale = i18n.language === 'nl' ? 'nl-NL' : 'en-US';

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split("T")[0];
      const label = period === "week"
        ? date.toLocaleDateString(locale, { weekday: "short" })
        : `${date.getDate()}/${date.getMonth() + 1}`;

      const dayCredits = usageData
        .filter((u) => u.created_at.startsWith(dateStr))
        .reduce((sum, u) => sum + u.credits_used, 0);

      result.push({ date: dateStr, label, credits: dayCredits });
    }
    return result;
  };

  const getActionBreakdown = () => {
    const breakdown: Record<string, number> = {};
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    usageData
      .filter((u) => new Date(u.created_at) >= startOfMonth)
      .forEach((u) => {
        breakdown[u.action_type] = (breakdown[u.action_type] || 0) + u.credits_used;
      });

    return Object.entries(breakdown)
      .map(([type, count]) => ({
        type,
        label: ACTION_LABELS[type] || type,
        count,
      }))
      .sort((a, b) => b.count - a.count);
  };

  const getTodayUsage = () => {
    const today = new Date().toISOString().split("T")[0];
    return usageData
      .filter((u) => u.created_at.startsWith(today))
      .reduce((sum, u) => sum + u.credits_used, 0);
  };

  if (creditsLoading || isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            {t('common.loading')}
          </div>
        </CardContent>
      </Card>
    );
  }

  const dailyData = getDailyData();
  const actionBreakdown = getActionBreakdown();
  const todayUsage = getTodayUsage();
  const percentage = credits ? Math.round((credits.used / credits.limit) * 100) : 0;
  const isLow = credits ? credits.remaining <= Math.ceil(credits.limit * 0.2) : false;
  const isExhausted = credits ? credits.remaining <= 0 : false;

  const planLabels: Record<string, string> = {
    free: "Free",
    scale: "Scale",
    enterprise: "Enterprise",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-primary/10">
                <Zap className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">{t('credits.remaining')}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className={`text-2xl font-bold ${isExhausted ? "text-destructive" : isLow ? "text-orange-500" : ""}`}>
                    {credits?.remaining ?? "-"}
                  </p>
                  <span className="text-xs text-muted-foreground">/ {credits?.limit}</span>
                </div>
                <Progress value={percentage} className="h-1 mt-1.5" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <Activity className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('credits.usedToday')}</p>
                <p className="text-2xl font-bold">{todayUsage}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-lg bg-muted">
                <Calendar className="h-5 w-5 text-muted-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{t('credits.thisMonth')}</p>
                <div className="flex items-baseline gap-1.5">
                  <p className="text-2xl font-bold">{credits?.used ?? 0}</p>
                  <Badge variant="outline" className="text-[10px]">
                    {planLabels[credits?.plan || "free"]}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              {t('credits.usage')}
            </CardTitle>
            <Tabs value={period} onValueChange={(v) => setPeriod(v as "week" | "month")}>
              <TabsList className="h-8">
                <TabsTrigger value="week" className="text-xs px-3 h-6">{t('credits.week')}</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3 h-6">{t('credits.month')}</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} className="text-muted-foreground" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    fontSize: "12px",
                  }}
                  labelFormatter={(label) => `${label}`}
                  formatter={(value: number) => [`${value} ${t('credits.creditsLabel')}`, t('credits.verbruik')]}
                />
                <Bar dataKey="credits" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {actionBreakdown.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('credits.usagePerFunction')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {actionBreakdown.map((item) => (
              <div key={item.type} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: ACTION_COLORS[item.type] || "hsl(var(--muted-foreground))" }}
                  />
                  <span className="text-sm">{item.label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{item.count}</span>
                  <span className="text-xs text-muted-foreground">{t('credits.creditsLabel')}</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
