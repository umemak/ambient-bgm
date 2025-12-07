import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MusicProviderSelectorProps {
  provider: 'elevenlabs' | 'replicate';
  duration: number;
  onProviderChange: (provider: 'elevenlabs' | 'replicate') => void;
  onDurationChange: (duration: number) => void;
  providersStatus?: {
    elevenlabs?: { configured: boolean; available: boolean };
    replicate?: { configured: boolean; available: boolean };
  };
}

export function MusicProviderSelector({
  provider,
  duration,
  onProviderChange,
  onDurationChange,
  providersStatus,
}: MusicProviderSelectorProps) {
  const elevenlabsAvailable = providersStatus?.elevenlabs?.configured ?? false;
  const replicateAvailable = providersStatus?.replicate?.configured ?? false;

  // If neither provider is configured, show warning
  if (!elevenlabsAvailable && !replicateAvailable) {
    return (
      <div className="space-y-2 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
        <p className="text-sm text-yellow-300">
          No music generation providers configured. Please configure ElevenLabs or Replicate API keys.
        </p>
      </div>
    );
  }

  // Auto-select first available provider
  if ((provider === 'elevenlabs' && !elevenlabsAvailable && replicateAvailable) ||
      (provider === 'replicate' && !replicateAvailable && elevenlabsAvailable)) {
    onProviderChange(replicateAvailable ? 'replicate' : 'elevenlabs');
  }

  const maxDuration = provider === 'replicate' ? 190 : 300;

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="provider" className="flex items-center gap-2">
          Music Provider
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-muted-foreground cursor-help" />
              </TooltipTrigger>
              <TooltipContent>
                <div className="space-y-1 text-sm">
                  <p><strong>ElevenLabs:</strong> Fast, up to 5 minutes (300s)</p>
                  <p><strong>Replicate (MusicGen):</strong> High quality, up to 3.2 minutes (190s)</p>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </Label>
        <Select value={provider} onValueChange={(v) => onProviderChange(v as 'elevenlabs' | 'replicate')}>
          <SelectTrigger id="provider" className="glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem 
              value="elevenlabs" 
              disabled={!elevenlabsAvailable}
            >
              ElevenLabs {!elevenlabsAvailable && '(Not configured)'}
            </SelectItem>
            <SelectItem 
              value="replicate" 
              disabled={!replicateAvailable}
            >
              Replicate (MusicGen) {!replicateAvailable && '(Not configured)'}
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="duration" className="flex items-center gap-2">
          Duration (seconds)
          <span className="text-xs text-muted-foreground">
            Max: {maxDuration}s
          </span>
        </Label>
        <Select 
          value={duration.toString()} 
          onValueChange={(v) => onDurationChange(parseInt(v))}
        >
          <SelectTrigger id="duration" className="glass">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="30">30 seconds</SelectItem>
            <SelectItem value="60">60 seconds (1 min)</SelectItem>
            <SelectItem value="90">90 seconds (1.5 min)</SelectItem>
            <SelectItem value="120">120 seconds (2 min)</SelectItem>
            <SelectItem value="150">150 seconds (2.5 min)</SelectItem>
            <SelectItem value="180">180 seconds (3 min)</SelectItem>
            {provider === 'replicate' && (
              <SelectItem value="190">190 seconds (3.2 min)</SelectItem>
            )}
            {provider === 'elevenlabs' && (
              <>
                <SelectItem value="210">210 seconds (3.5 min)</SelectItem>
                <SelectItem value="240">240 seconds (4 min)</SelectItem>
                <SelectItem value="270">270 seconds (4.5 min)</SelectItem>
                <SelectItem value="300">300 seconds (5 min)</SelectItem>
              </>
            )}
          </SelectContent>
        </Select>
      </div>

      {/* Info box */}
      <div className="text-xs text-muted-foreground space-y-1 p-2 rounded bg-white/5">
        {provider === 'elevenlabs' && (
          <p>⚡ ElevenLabs: Fast generation, high-quality music (10s - 5 min)</p>
        )}
        {provider === 'replicate' && (
          <p>🎵 Replicate MusicGen: High-quality stereo, perfect for BGM (up to 190s)</p>
        )}
      </div>
    </div>
  );
}
