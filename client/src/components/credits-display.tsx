import { Zap, TrendingUp, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface SubscriptionInfo {
  tier: string;
  characterCount: number;
  characterLimit: number;
  canExtendCharacterLimit: boolean;
  allowedToExtendCharacterLimit: boolean;
  nextCharacterCountResetUnix: number;
  status: string;
}

interface CreditsDisplayProps {
  subscription?: SubscriptionInfo;
}

export function CreditsDisplay({ subscription }: CreditsDisplayProps) {
  if (!subscription) {
    return null;
  }

  const used = subscription.characterCount;
  const limit = subscription.characterLimit;
  const remaining = Math.max(0, limit - used);
  const percentage = limit > 0 ? (used / limit) * 100 : 0;
  
  // Format reset date
  const resetDate = subscription.nextCharacterCountResetUnix 
    ? new Date(subscription.nextCharacterCountResetUnix * 1000).toLocaleDateString()
    : 'N/A';

  // Determine color based on usage
  const getColor = () => {
    if (percentage >= 90) return 'text-red-400';
    if (percentage >= 70) return 'text-yellow-400';
    return 'text-green-400';
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat().format(num);
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
          <Zap className={`w-4 h-4 ${getColor()}`} />
          <span className="text-white/90 text-sm font-medium">
            {formatNumber(remaining)}
          </span>
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="glass-strong border-white/20 text-white p-4 max-w-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">Plan</span>
            <Badge variant="secondary" className="glass text-white/90 border-white/20">
              {subscription.tier}
            </Badge>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Used</span>
              <span className="text-white/90 font-medium">{formatNumber(used)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70">Limit</span>
              <span className="text-white/90 font-medium">{formatNumber(limit)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Remaining
              </span>
              <span className={`font-medium ${getColor()}`}>{formatNumber(remaining)}</span>
            </div>
          </div>

          <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
            <div
              className={`h-full transition-all duration-500 ${
                percentage >= 90 ? 'bg-red-400' : percentage >= 70 ? 'bg-yellow-400' : 'bg-green-400'
              }`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>

          <div className="flex items-center gap-1 text-xs text-white/60 pt-1 border-t border-white/10">
            <Calendar className="w-3 h-3" />
            <span>Resets: {resetDate}</span>
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
