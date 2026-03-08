import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Zap } from "lucide-react";

interface CreditInfo {
  plan: string;
  limit: number;
  used: number;
  remaining: number;
}

interface AiCreditsDisplayProps {
  credits: CreditInfo | null;
  isLoading?: boolean;
  compact?: boolean;
}

const planLabels: Record<string, string> = {
  free: "Free",
  scale: "Scale",
  enterprise: "Enterprise",
};

export const AiCreditsDisplay = ({ credits, isLoading, compact = false }: AiCreditsDisplayProps) => {
  if (isLoading || !credits) return null;

  const percentage = Math.round((credits.used / credits.limit) * 100);
  const isLow = credits.remaining <= Math.ceil(credits.limit * 0.2);
  const isExhausted = credits.remaining <= 0;

  if (compact) {
    return (
      <Badge
        variant={isExhausted ? "destructive" : isLow ? "secondary" : "outline"}
        className="gap-1 text-xs"
      >
        <Zap className="h-3 w-3" />
        {credits.remaining}/{credits.limit} credits
      </Badge>
    );
  }

  return (
    <div className="rounded-lg border border-border/50 bg-muted/30 p-3 space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="flex items-center gap-1.5 font-medium">
          <Zap className="h-3.5 w-3.5 text-primary" />
          AI Credits
          <Badge variant="outline" className="text-[10px] px-1.5 py-0">
            {planLabels[credits.plan] || credits.plan}
          </Badge>
        </span>
        <span className={`text-xs ${isExhausted ? 'text-destructive font-semibold' : isLow ? 'text-orange-500' : 'text-muted-foreground'}`}>
          {credits.remaining} van {credits.limit} over
        </span>
      </div>
      <Progress value={percentage} className="h-1.5" />
      {isExhausted && (
        <p className="text-xs text-destructive">
          Je AI-credits zijn op. Upgrade je plan of wacht tot volgende maand.
        </p>
      )}
      {isLow && !isExhausted && (
        <p className="text-xs text-orange-500">
          Je credits raken op. Nog {credits.remaining} over deze maand.
        </p>
      )}
    </div>
  );
};
