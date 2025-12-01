import { MapPin, Thermometer, Droplets } from "lucide-react";
import { WeatherIcon } from "./weather-icon";
import type { WeatherData, TimeOfDay } from "@shared/schema";
import { getWeatherLabel, getTimeOfDayLabel } from "@/lib/weather-utils";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface WeatherDisplayProps {
  weather: WeatherData | null;
  timeOfDay: TimeOfDay;
  isLoading: boolean;
}

export function WeatherDisplay({ weather, timeOfDay, isLoading }: WeatherDisplayProps) {
  if (isLoading) {
    return (
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl glass">
        <div className="flex items-center gap-4">
          <Skeleton className="w-12 h-12 rounded-full bg-white/20" />
          <div className="space-y-2">
            <Skeleton className="w-24 h-5 bg-white/20" />
            <Skeleton className="w-32 h-4 bg-white/15" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="w-16 h-8 bg-white/15 rounded-full" />
          <Skeleton className="w-12 h-8 bg-white/15 rounded-full" />
        </div>
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex items-center justify-center p-6 rounded-2xl glass text-white/70">
        <p className="text-sm" data-testid="text-no-weather">
          Location data needed to fetch weather
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 p-4 rounded-2xl glass">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 rounded-full glass-strong flex items-center justify-center">
          <WeatherIcon
            condition={weather.condition}
            timeOfDay={timeOfDay}
            className="w-7 h-7 text-white"
          />
        </div>
        <div>
          <div className="flex items-center gap-2 text-white font-medium" data-testid="text-weather-condition">
            {getWeatherLabel(weather.condition)}
            <span className="text-white/60">•</span>
            <span className="text-white/80">{getTimeOfDayLabel(timeOfDay)}</span>
          </div>
          <div className="flex items-center gap-1 text-white/70 text-sm" data-testid="text-weather-location">
            <MapPin className="w-3 h-3" />
            {weather.location}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="glass text-white border-white/20 gap-1" data-testid="badge-temperature">
          <Thermometer className="w-3 h-3" />
          {Math.round(weather.temperature)}°C
        </Badge>
        {weather.humidity !== undefined && (
          <Badge variant="secondary" className="glass text-white border-white/20 gap-1" data-testid="badge-humidity">
            <Droplets className="w-3 h-3" />
            {weather.humidity}%
          </Badge>
        )}
      </div>
    </div>
  );
}
