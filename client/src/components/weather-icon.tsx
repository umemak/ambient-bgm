import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  CloudFog,
  Wind,
  Moon,
  CloudSun,
  Sparkles,
} from "lucide-react";
import type { WeatherCondition, TimeOfDay } from "@shared/schema";

interface WeatherIconProps {
  condition: WeatherCondition;
  timeOfDay: TimeOfDay;
  className?: string;
}

export function WeatherIcon({ condition, timeOfDay, className = "w-8 h-8" }: WeatherIconProps) {
  const isNight = timeOfDay === "night";

  const iconProps = { className };

  if (isNight) {
    switch (condition) {
      case "clear":
      case "sunny":
        return <Moon {...iconProps} />;
      case "cloudy":
        return <Cloud {...iconProps} />;
      case "rainy":
        return <CloudRain {...iconProps} />;
      case "snowy":
        return <CloudSnow {...iconProps} />;
      case "stormy":
        return <CloudLightning {...iconProps} />;
      case "foggy":
        return <CloudFog {...iconProps} />;
      case "windy":
        return <Wind {...iconProps} />;
      default:
        return <Moon {...iconProps} />;
    }
  }

  switch (condition) {
    case "sunny":
      return <Sun {...iconProps} />;
    case "clear":
      return <Sparkles {...iconProps} />;
    case "cloudy":
      return <CloudSun {...iconProps} />;
    case "rainy":
      return <CloudRain {...iconProps} />;
    case "snowy":
      return <CloudSnow {...iconProps} />;
    case "stormy":
      return <CloudLightning {...iconProps} />;
    case "foggy":
      return <CloudFog {...iconProps} />;
    case "windy":
      return <Wind {...iconProps} />;
    default:
      return <Sun {...iconProps} />;
  }
}
