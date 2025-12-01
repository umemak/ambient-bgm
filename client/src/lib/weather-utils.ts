import type { WeatherCondition, TimeOfDay } from "@shared/schema";

export function getTimeOfDay(): TimeOfDay {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "morning";
  if (hour >= 12 && hour < 17) return "afternoon";
  if (hour >= 17 && hour < 21) return "evening";
  return "night";
}

export function getTimeOfDayLabel(timeOfDay: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    morning: "Morning",
    afternoon: "Afternoon",
    evening: "Evening",
    night: "Night",
  };
  return labels[timeOfDay];
}

export function getTimeOfDayJapanese(timeOfDay: TimeOfDay): string {
  const labels: Record<TimeOfDay, string> = {
    morning: "朝",
    afternoon: "昼",
    evening: "夕方",
    night: "夜",
  };
  return labels[timeOfDay];
}

export function getWeatherLabel(condition: WeatherCondition): string {
  const labels: Record<WeatherCondition, string> = {
    sunny: "Sunny",
    cloudy: "Cloudy",
    rainy: "Rainy",
    snowy: "Snowy",
    stormy: "Stormy",
    foggy: "Foggy",
    windy: "Windy",
    clear: "Clear",
  };
  return labels[condition];
}

export function getWeatherJapanese(condition: WeatherCondition): string {
  const labels: Record<WeatherCondition, string> = {
    sunny: "晴れ",
    cloudy: "曇り",
    rainy: "雨",
    snowy: "雪",
    stormy: "嵐",
    foggy: "霧",
    windy: "風",
    clear: "快晴",
  };
  return labels[condition];
}

export interface WeatherTheme {
  gradientFrom: string;
  gradientVia: string;
  gradientTo: string;
  overlayOpacity: string;
  textColor: string;
  accentColor: string;
}

export function getWeatherTheme(
  condition: WeatherCondition,
  timeOfDay: TimeOfDay
): WeatherTheme {
  const isNight = timeOfDay === "night";
  const isEvening = timeOfDay === "evening";

  if (isNight) {
    return {
      gradientFrom: "from-slate-900",
      gradientVia: "via-indigo-950",
      gradientTo: "to-slate-950",
      overlayOpacity: "opacity-60",
      textColor: "text-white",
      accentColor: "text-indigo-300",
    };
  }

  if (isEvening) {
    switch (condition) {
      case "rainy":
      case "stormy":
        return {
          gradientFrom: "from-slate-700",
          gradientVia: "via-blue-800",
          gradientTo: "to-slate-800",
          overlayOpacity: "opacity-50",
          textColor: "text-white",
          accentColor: "text-blue-300",
        };
      default:
        return {
          gradientFrom: "from-orange-400",
          gradientVia: "via-rose-500",
          gradientTo: "to-purple-700",
          overlayOpacity: "opacity-40",
          textColor: "text-white",
          accentColor: "text-amber-200",
        };
    }
  }

  switch (condition) {
    case "sunny":
    case "clear":
      return {
        gradientFrom: "from-sky-400",
        gradientVia: "via-blue-500",
        gradientTo: "to-sky-600",
        overlayOpacity: "opacity-30",
        textColor: "text-white",
        accentColor: "text-amber-200",
      };
    case "cloudy":
      return {
        gradientFrom: "from-slate-400",
        gradientVia: "via-gray-500",
        gradientTo: "to-slate-600",
        overlayOpacity: "opacity-40",
        textColor: "text-white",
        accentColor: "text-slate-200",
      };
    case "rainy":
      return {
        gradientFrom: "from-slate-600",
        gradientVia: "via-blue-700",
        gradientTo: "to-slate-800",
        overlayOpacity: "opacity-50",
        textColor: "text-white",
        accentColor: "text-blue-200",
      };
    case "snowy":
      return {
        gradientFrom: "from-slate-200",
        gradientVia: "via-blue-100",
        gradientTo: "to-white",
        overlayOpacity: "opacity-20",
        textColor: "text-slate-800",
        accentColor: "text-blue-500",
      };
    case "stormy":
      return {
        gradientFrom: "from-slate-800",
        gradientVia: "via-purple-900",
        gradientTo: "to-slate-900",
        overlayOpacity: "opacity-60",
        textColor: "text-white",
        accentColor: "text-purple-300",
      };
    case "foggy":
      return {
        gradientFrom: "from-gray-400",
        gradientVia: "via-slate-400",
        gradientTo: "to-gray-500",
        overlayOpacity: "opacity-50",
        textColor: "text-white",
        accentColor: "text-gray-200",
      };
    case "windy":
      return {
        gradientFrom: "from-teal-400",
        gradientVia: "via-cyan-500",
        gradientTo: "to-teal-600",
        overlayOpacity: "opacity-35",
        textColor: "text-white",
        accentColor: "text-teal-200",
      };
    default:
      return {
        gradientFrom: "from-sky-400",
        gradientVia: "via-blue-500",
        gradientTo: "to-sky-600",
        overlayOpacity: "opacity-30",
        textColor: "text-white",
        accentColor: "text-amber-200",
      };
  }
}
