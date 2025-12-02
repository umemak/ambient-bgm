import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { WeatherBackground } from "@/components/weather-background";
import { PlayerCard } from "@/components/player-card";
import { useGeolocation } from "@/hooks/use-geolocation";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { getTimeOfDay } from "@/lib/weather-utils";
import type { WeatherData, BGM, TimeOfDay, WeatherCondition, MusicGenre } from "@shared/schema";
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
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>(getTimeOfDay());
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useLocalStorage("ambient-bgm-volume", 0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [manualLocation, setManualLocation] = useLocalStorage("ambient-bgm-manual-location", "");
  const [useAutoLocation, setUseAutoLocation] = useLocalStorage("ambient-bgm-auto-location", true);
  const [currentBgm, setCurrentBgm] = useState<BGM | null>(null);
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(-1);
  const [preferredGenre, setPreferredGenre] = useLocalStorage<MusicGenre>("ambient-bgm-preferred-genre", "auto");
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const bgmHistoryQuery = useQuery<{ success: boolean; data: BGM[] }>({
    queryKey: ["/api/bgm"],
    staleTime: 30000,
  });
  
  const bgmHistory = useMemo(() => bgmHistoryQuery.data?.data ?? [], [bgmHistoryQuery.data]);

  const musicStatusQuery = useQuery<{ success: boolean; data: { configured: boolean } }>({
    queryKey: ["/api/music", "status"],
    queryFn: async () => {
      const res = await fetch("/api/music/status");
      return res.json();
    },
    staleTime: Infinity,
  });

  const isMusicServiceConfigured = musicStatusQuery.data?.data?.configured ?? false;

  useEffect(() => {
    if (currentBgm && bgmHistory.length > 0) {
      const newIndex = bgmHistory.findIndex(b => b.id === currentBgm.id);
      if (newIndex !== -1 && newIndex !== currentHistoryIndex) {
        setCurrentHistoryIndex(newIndex);
      } else if (newIndex === -1) {
        setCurrentBgm(null);
        setCurrentHistoryIndex(-1);
        setIsPlaying(false);
      }
    }
  }, [bgmHistory, currentBgm, currentHistoryIndex]);

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
        preferredGenre,
      });
      return response as BGM;
    },
    onSuccess: (newBgm) => {
      setCurrentBgm(newBgm);
      setCurrentHistoryIndex(0);
      setIsPlaying(true);
      const previousData = queryClient.getQueryData<{ success: boolean; data: BGM[] }>(["/api/bgm"]);
      const existingBgms = previousData?.data ?? [];
      queryClient.setQueryData<{ success: boolean; data: BGM[] }>(["/api/bgm"], {
        success: true,
        data: [newBgm, ...existingBgms.filter(b => b.id !== newBgm.id)],
      });
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
  
  const deleteBgmMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/bgm/${id}`);
      return id;
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ["/api/bgm"] });
      const previous = queryClient.getQueryData<{ success: boolean; data: BGM[] }>(["/api/bgm"]);
      queryClient.setQueryData<{ success: boolean; data: BGM[] }>(["/api/bgm"], (old) => ({
        success: true,
        data: old?.data?.filter(b => b.id !== deletedId) ?? [],
      }));
      return { previous };
    },
    onError: (_err, _deletedId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/bgm"], context.previous);
      }
    },
    onSuccess: (deletedId) => {
      if (currentBgm?.id === deletedId) {
        setCurrentBgm(null);
        setCurrentHistoryIndex(-1);
        setIsPlaying(false);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bgm"] });
    },
  });

  const generateAudioMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsGeneratingAudio(true);
      const response = await apiRequest("POST", `/api/bgm/${id}/audio`);
      return response as BGM;
    },
    onSuccess: (updatedBgm) => {
      setCurrentBgm(updatedBgm);
      queryClient.setQueryData<{ success: boolean; data: BGM[] }>(["/api/bgm"], (old) => ({
        success: true,
        data: old?.data?.map(b => b.id === updatedBgm.id ? updatedBgm : b) ?? [],
      }));
      toast({
        title: "Audio Generated",
        description: "Music is ready to play!",
      });
    },
    onError: (error: any) => {
      console.error("Failed to generate audio:", error);
      toast({
        title: "Audio Generation Failed",
        description: error?.message || "Could not generate audio. Please try again.",
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsGeneratingAudio(false);
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("POST", `/api/bgm/${id}/favorite`);
      return response as BGM;
    },
    onMutate: async (bgmId) => {
      await queryClient.cancelQueries({ queryKey: ["/api/bgm"] });
      const previous = queryClient.getQueryData<{ success: boolean; data: BGM[] }>(["/api/bgm"]);
      queryClient.setQueryData<{ success: boolean; data: BGM[] }>(["/api/bgm"], (old) => ({
        success: true,
        data: old?.data?.map(b => 
          b.id === bgmId ? { ...b, isFavorite: !b.isFavorite } : b
        ) ?? [],
      }));
      return { previous };
    },
    onError: (_err, _bgmId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["/api/bgm"], context.previous);
      }
    },
    onSuccess: (updatedBgm) => {
      if (currentBgm?.id === updatedBgm.id) {
        setCurrentBgm(updatedBgm);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bgm"] });
      queryClient.invalidateQueries({ queryKey: ["/api/favorites"] });
    },
  });

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (audioRef.current && currentBgm?.audioUrl) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentBgm?.audioUrl]);

  useEffect(() => {
    if (currentBgm?.audioUrl && audioRef.current) {
      audioRef.current.src = currentBgm.audioUrl;
      audioRef.current.load();
      if (isPlaying) {
        audioRef.current.play().catch(console.error);
      }
    }
  }, [currentBgm?.audioUrl]);

  const handlePlayPause = useCallback(() => {
    if (!currentBgm && !generateBgmMutation.isPending) {
      generateBgmMutation.mutate();
    } else {
      setIsPlaying((prev) => !prev);
    }
  }, [currentBgm, generateBgmMutation]);

  const handleGenerateAudio = useCallback(() => {
    if (currentBgm && !generateAudioMutation.isPending) {
      generateAudioMutation.mutate(currentBgm.id);
    }
  }, [currentBgm, generateAudioMutation]);

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

  const handleDeleteBgm = useCallback((id: number) => {
    deleteBgmMutation.mutate(id);
    toast({
      title: "BGM Deleted",
      description: "The track has been removed from history.",
    });
  }, [deleteBgmMutation, toast]);

  const handleToggleFavorite = useCallback((id: number) => {
    toggleFavoriteMutation.mutate(id);
  }, [toggleFavoriteMutation]);

  const handleClearHistory = useCallback(async () => {
    for (const bgm of bgmHistory) {
      await apiRequest("DELETE", `/api/bgm/${bgm.id}`);
    }
    queryClient.invalidateQueries({ queryKey: ["/api/bgm"] });
    setCurrentBgm(null);
    setCurrentHistoryIndex(-1);
    setIsPlaying(false);
    toast({
      title: "History Cleared",
      description: "All BGM history has been removed.",
    });
  }, [bgmHistory, toast]);

  const handleApplyLocation = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["/api/weather"] });
  }, []);

  const displayWeather: WeatherData = weather;
  const displayCondition: WeatherCondition = displayWeather.condition;

  return (
    <div className="min-h-screen relative overflow-hidden">
      <WeatherBackground condition={displayCondition} timeOfDay={timeOfDay} />
      
      <audio
        ref={audioRef}
        loop
        onEnded={() => setIsPlaying(false)}
        data-testid="audio-player"
      />
      
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
          onDeleteBgm={handleDeleteBgm}
          onToggleFavorite={handleToggleFavorite}
          preferredGenre={preferredGenre}
          onGenreChange={setPreferredGenre}
          isMusicServiceConfigured={isMusicServiceConfigured}
          isGeneratingAudio={isGeneratingAudio}
          onGenerateAudio={handleGenerateAudio}
        />
      </div>
    </div>
  );
}
