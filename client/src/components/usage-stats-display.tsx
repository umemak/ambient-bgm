import { DollarSign, Clock, Hash, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

interface UsageStats {
  totalGenerations: number;
  totalDurationSeconds: number;
  totalCostUsd?: number;
  lastUpdated: string;
}

interface UsageStatsDisplayProps {
  provider: 'elevenlabs' | 'replicate';
  stats?: UsageStats;
}

export function UsageStatsDisplay({ provider, stats }: UsageStatsDisplayProps) {
  if (!stats) {
    return null;
  }

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  };

  const formatCost = (cost: number) => {
    return `$${cost.toFixed(4)}`;
  };

  const providerName = provider === 'elevenlabs' ? 'ElevenLabs' : 'Replicate';
  const showCost = provider === 'replicate' && stats.totalCostUsd !== undefined;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div className="glass rounded-full px-3 py-1.5 flex items-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
          {showCost ? (
            <>
              <DollarSign className="w-4 h-4 text-blue-400" />
              <span className="text-white/90 text-sm font-medium">
                {formatCost(stats.totalCostUsd!)}
              </span>
            </>
          ) : (
            <>
              <Clock className="w-4 h-4 text-purple-400" />
              <span className="text-white/90 text-sm font-medium">
                {formatDuration(stats.totalDurationSeconds)}
              </span>
            </>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent side="bottom" className="glass-strong border-white/20 text-white p-4 max-w-xs">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-white/70 text-sm">Provider</span>
            <Badge variant="secondary" className="glass text-white/90 border-white/20">
              {providerName}
            </Badge>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70 flex items-center gap-1">
                <Hash className="w-3 h-3" />
                Generations
              </span>
              <span className="text-white/90 font-medium">{stats.totalGenerations}</span>
            </div>
            
            <div className="flex items-center justify-between text-sm">
              <span className="text-white/70 flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Total Duration
              </span>
              <span className="text-white/90 font-medium">{formatDuration(stats.totalDurationSeconds)}</span>
            </div>
            
            {showCost && (
              <>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/70 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" />
                    Total Cost
                  </span>
                  <span className="text-blue-400 font-medium">{formatCost(stats.totalCostUsd!)}</span>
                </div>
                
                <div className="flex items-center justify-between text-sm pt-2 border-t border-white/10">
                  <span className="text-white/70 flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Avg Cost/Gen
                  </span>
                  <span className="text-white/90 font-medium">
                    {formatCost(stats.totalCostUsd! / stats.totalGenerations)}
                  </span>
                </div>
              </>
            )}
          </div>

          <div className="text-xs text-white/60 pt-1 border-t border-white/10">
            Updated: {new Date(stats.lastUpdated).toLocaleString()}
          </div>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
