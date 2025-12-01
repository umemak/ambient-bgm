import type { WeatherData, WeatherCondition } from "@shared/schema";

// Free weather API - Open-Meteo (no API key required)
const OPEN_METEO_BASE_URL = "https://api.open-meteo.com/v1/forecast";
const GEOCODING_URL = "https://geocoding-api.open-meteo.com/v1/search";

interface OpenMeteoResponse {
  current_weather?: {
    temperature: number;
    weathercode: number;
    windspeed: number;
  };
  latitude: number;
  longitude: number;
  hourly?: {
    relative_humidity_2m?: number[];
  };
}

interface GeocodingResult {
  results?: Array<{
    name: string;
    country: string;
    latitude: number;
    longitude: number;
  }>;
}

function weatherCodeToCondition(code: number): { condition: WeatherCondition; description: string } {
  // WMO Weather interpretation codes (complete coverage)
  // https://open-meteo.com/en/docs
  
  // Clear sky
  if (code === 0) return { condition: "clear", description: "Clear sky" };
  
  // Mainly clear, partly cloudy, overcast
  if (code === 1) return { condition: "sunny", description: "Mainly clear" };
  if (code === 2) return { condition: "cloudy", description: "Partly cloudy" };
  if (code === 3) return { condition: "cloudy", description: "Overcast" };
  
  // Fog and depositing rime fog
  if (code === 45) return { condition: "foggy", description: "Fog" };
  if (code === 48) return { condition: "foggy", description: "Depositing rime fog" };
  
  // Drizzle: Light, moderate, dense
  if (code === 51) return { condition: "rainy", description: "Light drizzle" };
  if (code === 53) return { condition: "rainy", description: "Moderate drizzle" };
  if (code === 55) return { condition: "rainy", description: "Dense drizzle" };
  
  // Freezing Drizzle: Light, dense
  if (code === 56) return { condition: "rainy", description: "Light freezing drizzle" };
  if (code === 57) return { condition: "rainy", description: "Dense freezing drizzle" };
  
  // Rain: Slight, moderate, heavy
  if (code === 61) return { condition: "rainy", description: "Slight rain" };
  if (code === 63) return { condition: "rainy", description: "Moderate rain" };
  if (code === 65) return { condition: "rainy", description: "Heavy rain" };
  
  // Freezing Rain: Light, heavy
  if (code === 66) return { condition: "rainy", description: "Light freezing rain" };
  if (code === 67) return { condition: "rainy", description: "Heavy freezing rain" };
  
  // Snow fall: Slight, moderate, heavy
  if (code === 71) return { condition: "snowy", description: "Slight snow" };
  if (code === 73) return { condition: "snowy", description: "Moderate snow" };
  if (code === 75) return { condition: "snowy", description: "Heavy snow" };
  
  // Snow grains
  if (code === 77) return { condition: "snowy", description: "Snow grains" };
  
  // Rain showers: Slight, moderate, violent
  if (code === 80) return { condition: "rainy", description: "Slight rain showers" };
  if (code === 81) return { condition: "rainy", description: "Moderate rain showers" };
  if (code === 82) return { condition: "rainy", description: "Violent rain showers" };
  
  // Snow showers: Slight, heavy
  if (code === 85) return { condition: "snowy", description: "Slight snow showers" };
  if (code === 86) return { condition: "snowy", description: "Heavy snow showers" };
  
  // Thunderstorm: Slight/moderate, with hail
  if (code === 95) return { condition: "stormy", description: "Thunderstorm" };
  if (code === 96) return { condition: "stormy", description: "Thunderstorm with slight hail" };
  if (code === 99) return { condition: "stormy", description: "Thunderstorm with heavy hail" };
  
  // Default fallback for any unrecognized codes
  return { condition: "cloudy", description: "Varied conditions" };
}

async function getLocationName(latitude: number, longitude: number): Promise<string> {
  try {
    // Use a simple approximation for location name based on geocoding search
    const geoUrl = `${GEOCODING_URL}?name=city&count=1&latitude=${latitude}&longitude=${longitude}`;
    const response = await fetch(geoUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        return `${data.results[0].name}, ${data.results[0].country}`;
      }
    }
  } catch (error) {
    console.error("Location name lookup failed:", error);
  }
  
  // Return coordinates as fallback
  return `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`;
}

export async function getWeatherByCoordinates(
  latitude: number,
  longitude: number
): Promise<WeatherData> {
  try {
    // Request current weather with current_weather=true
    const weatherUrl = `${OPEN_METEO_BASE_URL}?latitude=${latitude}&longitude=${longitude}&current_weather=true&hourly=relative_humidity_2m&timezone=auto`;
    
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData: OpenMeteoResponse = await weatherResponse.json();
    
    if (!weatherData.current_weather) {
      throw new Error("No current weather data available");
    }
    
    const currentWeather = weatherData.current_weather;
    const { condition, description } = weatherCodeToCondition(currentWeather.weathercode);
    
    // Get humidity from hourly data (first value is current hour)
    const humidity = weatherData.hourly?.relative_humidity_2m?.[0] ?? 50;
    
    // Check wind speed for windy condition (km/h)
    const isWindy = currentWeather.windspeed > 30;
    
    // Get location name
    const locationName = await getLocationName(latitude, longitude);
    
    return {
      condition: isWindy && condition !== "stormy" ? "windy" : condition,
      temperature: Math.round(currentWeather.temperature),
      humidity: Math.round(humidity),
      description: isWindy ? "Windy conditions" : description,
      location: locationName,
    };
  } catch (error) {
    console.error("Error fetching weather by coordinates:", error);
    throw error;
  }
}

export async function getWeatherByCity(cityName: string): Promise<WeatherData> {
  try {
    // First, geocode the city name
    const geoUrl = `${GEOCODING_URL}?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`;
    
    const geoResponse = await fetch(geoUrl);
    if (!geoResponse.ok) {
      throw new Error(`Geocoding API error: ${geoResponse.status}`);
    }
    
    const geoData: GeocodingResult = await geoResponse.json();
    
    if (!geoData.results || geoData.results.length === 0) {
      throw new Error(`City not found: ${cityName}`);
    }
    
    const place = geoData.results[0];
    
    // Get weather using coordinates
    const weatherUrl = `${OPEN_METEO_BASE_URL}?latitude=${place.latitude}&longitude=${place.longitude}&current_weather=true&hourly=relative_humidity_2m&timezone=auto`;
    
    const weatherResponse = await fetch(weatherUrl);
    if (!weatherResponse.ok) {
      throw new Error(`Weather API error: ${weatherResponse.status}`);
    }
    
    const weatherData: OpenMeteoResponse = await weatherResponse.json();
    
    if (!weatherData.current_weather) {
      throw new Error("No current weather data available");
    }
    
    const currentWeather = weatherData.current_weather;
    const { condition, description } = weatherCodeToCondition(currentWeather.weathercode);
    
    // Get humidity from hourly data
    const humidity = weatherData.hourly?.relative_humidity_2m?.[0] ?? 50;
    
    // Check wind speed for windy condition
    const isWindy = currentWeather.windspeed > 30;
    
    return {
      condition: isWindy && condition !== "stormy" ? "windy" : condition,
      temperature: Math.round(currentWeather.temperature),
      humidity: Math.round(humidity),
      description: isWindy ? "Windy conditions" : description,
      location: `${place.name}, ${place.country}`,
    };
  } catch (error) {
    console.error("Error fetching weather by city:", error);
    throw error;
  }
}
