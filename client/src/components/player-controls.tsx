import { Play, Pause, SkipForward, SkipBack, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

interface PlayerControlsProps {
  isPlaying: boolean;
  isLoading: boolean;
  volume: number;
  isMuted: boolean;
  onPlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  onRefresh: () => void;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
}

export function PlayerControls({
  isPlaying,
  isLoading,
  volume,
  isMuted,
  onPlayPause,
  onSkipNext,
  onSkipPrev,
  onRefresh,
  onVolumeChange,
  onToggleMute,
}: PlayerControlsProps) {
  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex items-center justify-center gap-4">
        <Button
          size="icon"
          variant="ghost"
          onClick={onSkipPrev}
          className="w-12 h-12 rounded-full glass text-white/90 hover:text-white hover:bg-white/20"
          aria-label="Previous track"
          data-testid="button-skip-prev"
        >
          <SkipBack className="w-5 h-5" />
        </Button>

        <Button
          size="icon"
          onClick={onPlayPause}
          disabled={isLoading}
          className={cn(
            "w-20 h-20 rounded-full glass-strong text-white transition-all duration-300",
            isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105 active:scale-95"
          )}
          aria-label={isPlaying ? "Pause" : "Play"}
          data-testid="button-play-pause"
        >
          {isLoading ? (
            <RefreshCw className="w-8 h-8 animate-spin" />
          ) : isPlaying ? (
            <Pause className="w-8 h-8" />
          ) : (
            <Play className="w-8 h-8 ml-1" />
          )}
        </Button>

        <Button
          size="icon"
          variant="ghost"
          onClick={onSkipNext}
          className="w-12 h-12 rounded-full glass text-white/90 hover:text-white hover:bg-white/20"
          aria-label="Next track"
          data-testid="button-skip-next"
        >
          <SkipForward className="w-5 h-5" />
        </Button>
      </div>

      <div className="flex items-center gap-4 w-full max-w-xs">
        <Button
          size="icon"
          variant="ghost"
          onClick={onToggleMute}
          className="w-10 h-10 rounded-full glass text-white/80 hover:text-white hover:bg-white/15"
          aria-label={isMuted ? "Unmute" : "Mute"}
          data-testid="button-toggle-mute"
        >
          {isMuted || volume === 0 ? (
            <VolumeX className="w-4 h-4" />
          ) : (
            <Volume2 className="w-4 h-4" />
          )}
        </Button>

        <Slider
          value={[isMuted ? 0 : volume * 100]}
          max={100}
          step={1}
          onValueChange={([v]) => onVolumeChange(v / 100)}
          className="flex-1"
          aria-label="Volume"
          data-testid="slider-volume"
        />
      </div>
    </div>
  );
}
