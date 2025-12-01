import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { WeatherBackground } from "@/components/weather-background";
import { PlayerCard } from "@/components/player-card";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { getTimeOfDay } from "@/lib/weather-utils";
import type { WeatherData, BGM, TimeOfDay, WeatherCondition } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

const DEFAULT_WEATHER: WeatherData = {
  condition: "clear",
  temperature: 20,
  humidity: 50,
  description: "Clear sky",
  location: "Unknown Location",
};

export default function Home() {
  const { toast } = useToast();
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useLocalStorage("ambient-bgm-volume", 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [manualLocation, setManualLocation] = useLocalStorage("ambient-bgm-manual-location", "");
  const [useAutoLocation, setUseAutoLocation] = useLocalStorage("ambient-bgm-auto-location", true);
  const [bgmHistory, setBgmHistory] = useLocalStorage<BGM[]>("ambient-bgm-history", []);
  const [currentBgm, setCurrentBgm] = useState<BGM | null>(null);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);

  const {
    location,
    loading: isLoadingLocation,
    error: locationError,
    requestLocation,
  } = useGeolocation();

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeOfDay(getTimeOfDay());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (useAutoLocation) {
      requestLocation();
    }
  }, [useAutoLocation, requestLocation]);

  const weatherQuery = useQuery<{ success: boolean; data: WeatherData }>({
    queryKey: [
      "/api/weather",
      useAutoLocation && location
        ? `?lat=${location.latitude}&lon=${location.longitude}`
        : !useAutoLocation && manualLocation
        ? `?city=${encodeURIComponent(manualLocation)}`
        : "",
    ],
    enabled: (useAutoLocation && !!location) || (!useAutoLocation && !!manualLocation),
    staleTime: 300000,
    select: (data) => data,
  });

  const weather = weatherQuery.data?.data ?? DEFAULT_WEATHER;

  const generateBgmMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/bgm/generate", {
        weather,
        timeOfDay,
      });
      return response as BGM;
    },
    onSuccess: (newBgm) => {
      setCurrentBgm(newBgm);
      setBgmHistory((prev) => {
        const filtered = prev.filter((b) => b.id !== newBgm.id);
        return [newBgm, ...filtered].slice(0, 10);
      });
      setCurrentHistoryIndex(0);
      setIsPlaying(true);
      toast({
        title: "New BGM Generated",
        description: newBgm.title,
      });
    },
    onError: (error) => {
      console.error("Failed to generate BGM:", error);
      toast({
        title: "Generation Failed",
        description: "Could not generate BGM. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handlePlayPause = useCallback(() => {
    if (!currentBgm && !generateBgmMutation.isPending) {
      generateBgmMutation.mutate();
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentBgm, generateBgmMutation]);

  const handleRefresh = useCallback(() => {
    if (!generateBgmMutation.isPending) {
      generateBgmMutation.mutate();
    }
  }, [generateBgmMutation]);

  const handleSkipNext = useCallback(() => {
    if (bgmHistory.length === 0) return;
    const nextIndex = (currentHistoryIndex + 1) % bgmHistory.length;
    setCurrentHistoryIndex(nextIndex);
    setCurrentBgm(bgmHistory[nextIndex]);
    setIsPlaying(true);
  }, [bgmHistory, currentHistoryIndex]);

  const handleSkipPrev = useCallback(() => {
    if (bgmHistory.length === 0) return;
    const prevIndex = currentHistoryIndex <= 0 ? bgmHistory.length - 1 : currentHistoryIndex - 1;
    setCurrentHistoryIndex(prevIndex);
    setCurrentBgm(bgmHistory[prevIndex]);
    setIsPlaying(true);
  }, [bgmHistory, currentHistoryIndex]);

  const handleVolumeChange = useCallback((value: number) => {
    setVolume(value);
    if (value > 0) setIsMuted(false);
  }, [setVolume]);

  const handleToggleMute = useCallback(() => {
    setIsMuted((prev) => !prev);
  }, []);

  const handleSelectBgm = useCallback((bgm: BGM) => {
    const index = bgmHistory.findIndex((b) => b.id === bgm.id);
    setCurrentBgm(bgm);
    setCurrentHistoryIndex(index);
    setIsPlaying(true);
  }, [bgmHistory]);

  const handleClearHistory = useCallback(() => {
    setBgmHistory([]);
    setCurrentBgm(null);
    setCurrentHistoryIndex(-1);
    setIsPlaying(false);
    toast({
      title: "History Cleared",
      description: "All BGM history has been removed.",
    });
  }, [setBgmHistory, toast]);

  const handleApplyLocation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/weather"] });
  }, []);

  const displayWeather: WeatherData = weather;
  const displayCondition: WeatherCondition = displayWeather.condition;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WeatherBackground condition={displayCondition} timeOfDay={timeOfDay} />
      
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4 md:p-8">
        <PlayerCard
          weather={weatherQuery.isLoading ? null : displayWeather}
          timeOfDay={timeOfDay}
          currentBgm={currentBgm}
          bgmHistory={bgmHistory}
          isPlaying={isPlaying}
          isLoading={generateBgmMutation.isPending}
          isGenerating={generateBgmMutation.isPending}
          isLoadingWeather={weatherQuery.isLoading}
          isLoadingLocation={isLoadingLocation}
          volume={volume}
          isMuted={isMuted}
          manualLocation={manualLocation}
          useAutoLocation={useAutoLocation}
          locationError={locationError}
          onPlayPause={handlePlayPause}
          onSkipNext={handleSkipNext}
          onSkipPrev={handleSkipPrev}
          onRefresh={handleRefresh}
          onVolumeChange={handleVolumeChange}
          onToggleMute={handleToggleMute}
          onRequestLocation={requestLocation}
          onManualLocationChange={setManualLocation}
          onAutoLocationToggle={setUseAutoLocation}
          onApplyLocation={handleApplyLocation}
          onSelectBgm={handleSelectBgm}
          onClearHistory={handleClearHistory}
        />
      </div>
    </div>
  );
}
