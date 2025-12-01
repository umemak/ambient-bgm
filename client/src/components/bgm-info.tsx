import { Music, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { BGM } from "@shared/schema";

interface BGMInfoProps {
  bgm: BGM | null;
  isGenerating: boolean;
}

export function BGMInfo({ bgm, isGenerating }: BGMInfoProps) {
  if (isGenerating) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full glass flex items-center justify-center">
            <Music className="w-6 h-6 text-white/80 animate-pulse" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-white" data-testid="text-generating-title">
            Generating...
          </h2>
          <p className="text-white/70 text-sm" data-testid="text-generating-description">
            Creating the perfect BGM for your current environment
          </p>
        </div>
        <div className="flex justify-center gap-2">
          <Badge variant="secondary" className="glass text-white/80 border-white/20">
            <Clock className="w-3 h-3 mr-1" />
            Please wait
          </Badge>
        </div>
      </div>
    );
  }

  if (!bgm) {
    return (
      <div className="text-center space-y-4">
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full glass flex items-center justify-center">
            <Music className="w-6 h-6 text-white/60" />
          </div>
        </div>
        <div className="space-y-2">
          <h2 className="font-display text-2xl font-semibold text-white/80" data-testid="text-no-bgm-title">
            No BGM Selected
          </h2>
          <p className="text-white/60 text-sm" data-testid="text-no-bgm-description">
            Click the button below to generate ambient music
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="text-center space-y-4">
      <div className="flex justify-center">
        <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center">
          <Music className="w-6 h-6 text-white" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-white" data-testid="text-bgm-title">
          {bgm.title}
        </h2>
        <p className="text-white/80 font-medium" data-testid="text-bgm-mood">
          {bgm.mood}
        </p>
        <p className="text-white/60 text-sm max-w-md mx-auto leading-relaxed" data-testid="text-bgm-description">
          {bgm.description}
        </p>
      </div>

      <div className="flex justify-center flex-wrap gap-2">
        <Badge variant="secondary" className="glass text-white/80 border-white/20" data-testid="badge-bgm-genre">
          {bgm.genre}
        </Badge>
        <Badge variant="secondary" className="glass text-white/80 border-white/20" data-testid="badge-bgm-tempo">
          {bgm.tempo}
        </Badge>
      </div>
    </div>
  );
}
