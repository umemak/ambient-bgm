import { z } from "zod";

// Weather condition types
export const weatherConditions = [
  "sunny",
  "cloudy", 
  "rainy",
  "snowy",
  "stormy",
  "foggy",
  "windy",
  "clear"
] as const;

export type WeatherCondition = typeof weatherConditions[number];

// Time of day types
export const timeOfDayTypes = ["morning", "afternoon", "evening", "night"] as const;
export type TimeOfDay = typeof timeOfDayTypes[number];

// Music genre types for user selection
export const musicGenres = [
  "auto",
  "lo-fi",
  "jazz",
  "classical",
  "electronic",
  "ambient",
  "acoustic",
  "piano"
] as const;

export type MusicGenre = typeof musicGenres[number];

export const genreLabels: Record<MusicGenre, string> = {
  "auto": "Auto (Weather-based)",
  "lo-fi": "Lo-Fi Hip Hop",
  "jazz": "Jazz",
  "classical": "Classical",
  "electronic": "Electronic",
  "ambient": "Ambient",
  "acoustic": "Acoustic",
  "piano": "Piano"
};

// Weather data schema
export const weatherDataSchema = z.object({
  condition: z.enum(weatherConditions),
  temperature: z.number(),
  humidity: z.number().optional(),
  description: z.string(),
  location: z.string(),
  icon: z.string().optional(),
});

export type WeatherData = z.infer<typeof weatherDataSchema>;

// BGM schema
export const bgmSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  mood: z.string(),
  genre: z.string(),
  tempo: z.enum(["slow", "moderate", "upbeat"]),
  weatherCondition: z.enum(weatherConditions),
  timeOfDay: z.enum(timeOfDayTypes),
  createdAt: z.string(),
});

export type BGM = z.infer<typeof bgmSchema>;

// Insert BGM schema (for creating new BGMs)
export const insertBgmSchema = bgmSchema.omit({ id: true, createdAt: true });
export type InsertBGM = z.infer<typeof insertBgmSchema>;

// Location schema
export const locationSchema = z.object({
  latitude: z.number(),
  longitude: z.number(),
  city: z.string().optional(),
  country: z.string().optional(),
});

export type Location = z.infer<typeof locationSchema>;

// User settings schema
export const userSettingsSchema = z.object({
  manualLocation: z.string().optional(),
  useAutoLocation: z.boolean().default(true),
  volume: z.number().min(0).max(1).default(0.7),
});

export type UserSettings = z.infer<typeof userSettingsSchema>;

// Generate BGM request schema
export const generateBgmRequestSchema = z.object({
  weather: weatherDataSchema,
  timeOfDay: z.enum(timeOfDayTypes),
  preferredGenre: z.enum(musicGenres).optional().default("auto"),
});

export type GenerateBGMRequest = z.infer<typeof generateBgmRequestSchema>;

// API response schemas
export const weatherResponseSchema = z.object({
  success: z.boolean(),
  data: weatherDataSchema.optional(),
  error: z.string().optional(),
});

export const bgmResponseSchema = z.object({
  success: z.boolean(),
  data: bgmSchema.optional(),
  error: z.string().optional(),
});

export const bgmListResponseSchema = z.object({
  success: z.boolean(),
  data: z.array(bgmSchema).optional(),
  error: z.string().optional(),
});
