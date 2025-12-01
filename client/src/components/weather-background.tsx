import { useMemo } from "react";
import type { WeatherCondition, TimeOfDay } from "@shared/schema";
import { getWeatherTheme } from "@/lib/weather-utils";

interface WeatherBackgroundProps {
  condition: WeatherCondition;
  timeOfDay: TimeOfDay;
}

function RainEffect() {
  const drops = useMemo(() => {
    return Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 2}s`,
      duration: `${0.8 + Math.random() * 0.7}s`,
      opacity: 0.3 + Math.random() * 0.4,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {drops.map((drop) => (
        <div
          key={drop.id}
          className="absolute w-[2px] h-[20px] bg-gradient-to-b from-transparent via-blue-300/60 to-blue-400/80 rounded-full"
          style={{
            left: drop.left,
            opacity: drop.opacity,
            animation: `rain-fall ${drop.duration} linear infinite`,
            animationDelay: drop.delay,
          }}
        />
      ))}
    </div>
  );
}

function SnowEffect() {
  const flakes = useMemo(() => {
    return Array.from({ length: 40 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      delay: `${Math.random() * 5}s`,
      duration: `${6 + Math.random() * 4}s`,
      size: 3 + Math.random() * 5,
      opacity: 0.4 + Math.random() * 0.5,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {flakes.map((flake) => (
        <div
          key={flake.id}
          className="absolute rounded-full bg-white"
          style={{
            left: flake.left,
            width: flake.size,
            height: flake.size,
            opacity: flake.opacity,
            animation: `snow-fall ${flake.duration} linear infinite`,
            animationDelay: flake.delay,
          }}
        />
      ))}
    </div>
  );
}

function StarEffect() {
  const stars = useMemo(() => {
    return Array.from({ length: 60 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}%`,
      top: `${Math.random() * 60}%`,
      size: 1 + Math.random() * 2,
      delay: `${Math.random() * 3}s`,
      opacity: 0.3 + Math.random() * 0.7,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute rounded-full bg-white animate-twinkle"
          style={{
            left: star.left,
            top: star.top,
            width: star.size,
            height: star.size,
            opacity: star.opacity,
            animationDelay: star.delay,
          }}
        />
      ))}
    </div>
  );
}

function CloudEffect() {
  const clouds = useMemo(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      id: i,
      left: `${i * 25 - 10}%`,
      top: `${10 + Math.random() * 20}%`,
      scale: 0.8 + Math.random() * 0.5,
      opacity: 0.4 + Math.random() * 0.3,
      delay: `${i * 0.5}s`,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {clouds.map((cloud) => (
        <div
          key={cloud.id}
          className="absolute animate-float"
          style={{
            left: cloud.left,
            top: cloud.top,
            transform: `scale(${cloud.scale})`,
            opacity: cloud.opacity,
            animationDelay: cloud.delay,
          }}
        >
          <div className="relative">
            <div className="w-32 h-16 bg-white/30 rounded-full blur-xl" />
            <div className="absolute -top-4 left-8 w-20 h-12 bg-white/25 rounded-full blur-lg" />
            <div className="absolute -top-2 left-16 w-16 h-10 bg-white/20 rounded-full blur-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

function SunGlow() {
  return (
    <div className="absolute top-10 right-20 pointer-events-none">
      <div className="relative">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-yellow-200 to-amber-300 opacity-80 blur-xl animate-pulse-glow" />
        <div className="absolute inset-4 w-24 h-24 rounded-full bg-gradient-to-br from-yellow-100 to-amber-200 opacity-90 blur-lg" />
      </div>
    </div>
  );
}

export function WeatherBackground({ condition, timeOfDay }: WeatherBackgroundProps) {
  const theme = getWeatherTheme(condition, timeOfDay);
  const isNight = timeOfDay === "night";
  const isRaining = condition === "rainy" || condition === "stormy";
  const isSnowing = condition === "snowy";
  const isSunny = condition === "sunny" || condition === "clear";
  const isCloudy = condition === "cloudy" || condition === "foggy";

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      <div
        className={`absolute inset-0 bg-gradient-to-br ${theme.gradientFrom} ${theme.gradientVia} ${theme.gradientTo} animate-gradient transition-all duration-1000`}
      />
      
      <div className={`absolute inset-0 bg-black/10 ${theme.overlayOpacity}`} />
      
      {isNight && <StarEffect />}
      {isRaining && <RainEffect />}
      {isSnowing && <SnowEffect />}
      {isCloudy && !isNight && <CloudEffect />}
      {isSunny && !isNight && timeOfDay !== "evening" && <SunGlow />}
      
      <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
    </div>
  );
}
