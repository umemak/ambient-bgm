import { Music2, Loader2, Download, RefreshCw } from "lucide-react";
import { WeatherDisplay } from "./weather-display";
import { BGMInfo } from "./bgm-info";
import { PlayerControls } from "./player-controls";
import { LocationSettings } from "./location-settings";
import { BGMHistory } from "./bgm-history";
import { PlaylistManager } from "./playlist-manager";
import { ThemeToggle } from "./theme-toggle";
import { GenreSelector } from "./genre-selector";
import { UserMenu } from "./user-menu";
import { CreditsDisplay } from "./credits-display";
import { Button } from "@/components/ui/button";
import type { WeatherData, TimeOfDay, BGM, MusicGenre, User } from "@shared/schema";

interface PlayerCardProps {
  user: User;
  weather: WeatherData | null;
  timeOfDay: TimeOfDay;
  currentBgm: BGM | null;
  bgmHistory: BGM[];
  isPlaying: boolean;
  isLoading: boolean;
  isGenerating: boolean;
  isLoadingWeather: boolean;
  isLoadingLocation: boolean;
  volume: number;
  isMuted: boolean;
  manualLocation: string;
  useAutoLocation: boolean;
  locationError: string | null;
  onPlayPause: () => void;
  onSkipNext: () => void;
  onSkipPrev: () => void;
  onRefresh: () => void;
  onVolumeChange: (value: number) => void;
  onToggleMute: () => void;
  onRequestLocation: () => void;
  onManualLocationChange: (value: string) => void;
  onAutoLocationToggle: (value: boolean) => void;
  onApplyLocation: () => void;
  onSelectBgm: (bgm: BGM) => void;
  onClearHistory: () => void;
  onDeleteBgm?: (id: number) => void;
  onToggleFavorite?: (id: number) => void;
  preferredGenre: MusicGenre;
  onGenreChange: (genre: MusicGenre) => void;
  isMusicServiceConfigured?: boolean;
  isGeneratingAudio?: boolean;
  onGenerateAudio?: () => void;
  subscriptionInfo?: any;
}

export function PlayerCard({
  user,
  weather,
  timeOfDay,
  currentBgm,
  bgmHistory,
  isPlaying,
  isLoading,
  isGenerating,
  isLoadingWeather,
  isLoadingLocation,
  volume,
  isMuted,
  manualLocation,
  useAutoLocation,
  locationError,
  onPlayPause,
  onSkipNext,
  onSkipPrev,
  onRefresh,
  onVolumeChange,
  onToggleMute,
  onRequestLocation,
  onManualLocationChange,
  onAutoLocationToggle,
  onApplyLocation,
  onSelectBgm,
  onClearHistory,
  onDeleteBgm,
  onToggleFavorite,
  preferredGenre,
  onGenreChange,
  isMusicServiceConfigured,
  isGeneratingAudio,
  onGenerateAudio,
  subscriptionInfo,
}: PlayerCardProps) {
  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="glass-strong rounded-3xl p-6 md:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6 gap-2">
          <h1 className="font-display text-xl font-semibold text-white" data-testid="text-app-title">
            Ambient BGM
          </h1>
          <div className="flex items-center gap-2">
            {subscriptionInfo && <CreditsDisplay subscription={subscriptionInfo} />}
            <LocationSettings
              manualLocation={manualLocation}
              useAutoLocation={useAutoLocation}
              isLoadingLocation={isLoadingLocation}
              locationError={locationError}
              onRequestLocation={onRequestLocation}
              onManualLocationChange={onManualLocationChange}
              onAutoLocationToggle={onAutoLocationToggle}
              onApply={onApplyLocation}
            />
            <BGMHistory
              history={bgmHistory}
              currentBgmId={currentBgm?.id ?? null}
              onSelectBgm={onSelectBgm}
              onClearHistory={onClearHistory}
              onDeleteBgm={onDeleteBgm}
            />
            <PlaylistManager
              currentBgmId={currentBgm?.id ?? null}
              onSelectBgm={onSelectBgm}
            />
            <ThemeToggle />
            <UserMenu user={user} />
          </div>
        </div>

        <div className="space-y-8">
          <WeatherDisplay
            weather={weather}
            timeOfDay={timeOfDay}
            isLoading={isLoadingWeather}
          />

          <div className="flex justify-center py-2">
            <GenreSelector
              value={preferredGenre}
              onChange={onGenreChange}
              disabled={isGenerating}
            />
          </div>

          <div className="py-4">
            <BGMInfo bgm={currentBgm} isGenerating={isGenerating} onToggleFavorite={onToggleFavorite} />
          </div>

          <div className="flex justify-center pb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading || isGenerating}
              className="text-white/70 hover:text-white hover:bg-white/10 gap-2"
              data-testid="button-refresh-bgm"
            >
              <RefreshCw className={`w-4 h-4 ${isGenerating ? "animate-spin" : ""}`} />
              Generate New BGM
            </Button>
          </div>

          {isMusicServiceConfigured && currentBgm && !currentBgm.audioUrl && (
            <div className="flex justify-center pb-4">
              <Button
                onClick={onGenerateAudio}
                disabled={isGeneratingAudio}
                className="glass text-white hover:bg-white/20 gap-2"
                data-testid="button-generate-audio"
              >
                {isGeneratingAudio ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Audio...
                  </>
                ) : (
                  <>
                    <Music2 className="w-4 h-4" />
                    Generate Audio
                  </>
                )}
              </Button>
            </div>
          )}

          {currentBgm?.audioUrl && (
            <div className="flex justify-center items-center gap-4 pb-4">
              <span className="text-white/60 text-sm flex items-center gap-2">
                <Music2 className="w-4 h-4" />
                Audio Ready
              </span>
              <a
                href={currentBgm.audioUrl}
                download={`${currentBgm.title.replace(/[^a-zA-Z0-9]/g, '_')}.mp3`}
                className="glass text-white hover:bg-white/20 rounded-full p-2 transition-colors"
                data-testid="button-download-audio"
                title="Download Audio"
              >
                <Download className="w-4 h-4" />
              </a>
            </div>
          )}

          <PlayerControls
            isPlaying={isPlaying}
            isLoading={isLoading || isGenerating}
            volume={volume}
            isMuted={isMuted}
            onPlayPause={onPlayPause}
            onSkipNext={onSkipNext}
            onSkipPrev={onSkipPrev}
            onRefresh={onRefresh}
            onVolumeChange={onVolumeChange}
            onToggleMute={onToggleMute}
          />

          <div className="flex justify-center pt-2">
            <div className="w-full max-w-[200px] h-1 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-white/40 rounded-full transition-all duration-300"
                style={{ width: isPlaying ? "60%" : "0%" }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
