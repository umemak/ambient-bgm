import { z } from "zod";
import { pgTable, text, timestamp, serial, boolean, integer, varchar, jsonb, index } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { relations, sql } from "drizzle-orm";

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
  "piano",
  "house",
  "techno",
  "dnb",
  "edm",
  "funk",
  "disco",
  "rock",
  "indie"
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
  "piano": "Piano",
  "house": "House",
  "techno": "Techno",
  "dnb": "Drum & Bass",
  "edm": "EDM",
  "funk": "Funk",
  "disco": "Disco",
  "rock": "Rock",
  "indie": "Indie"
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

// BGM schema (frontend-compatible)
export const bgmSchema = z.object({
  id: z.number(),
  title: z.string(),
  description: z.string(),
  mood: z.string(),
  genre: z.string(),
  tempo: z.string(),
  weatherCondition: z.string(),
  timeOfDay: z.string(),
  isFavorite: z.boolean().optional(),
  audioUrl: z.string().nullable().optional(),
  createdAt: z.union([z.string(), z.date()]),
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

// Drizzle Tables for PostgreSQL persistence

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// BGM table for storing generated BGMs
export const bgms = pgTable("bgms", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  mood: text("mood").notNull(),
  genre: text("genre").notNull(),
  tempo: text("tempo").notNull(),
  weatherCondition: text("weather_condition").notNull(),
  timeOfDay: text("time_of_day").notNull(),
  isFavorite: boolean("is_favorite").default(false),
  audioUrl: text("audio_url"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertBgmDbSchema = createInsertSchema(bgms).omit({ id: true, createdAt: true });
export type InsertBGMDb = z.infer<typeof insertBgmDbSchema>;
export type BGMDb = typeof bgms.$inferSelect;

// Playlists table for organizing BGMs
export const playlists = pgTable("playlists", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertPlaylistSchema = createInsertSchema(playlists).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertPlaylist = z.infer<typeof insertPlaylistSchema>;
export type Playlist = typeof playlists.$inferSelect;

// Playlist items table for many-to-many relationship
export const playlistItems = pgTable("playlist_items", {
  id: serial("id").primaryKey(),
  playlistId: integer("playlist_id").notNull(),
  bgmId: integer("bgm_id").notNull(),
  position: integer("position").notNull().default(0),
  addedAt: timestamp("added_at").defaultNow().notNull(),
});

export type PlaylistItem = typeof playlistItems.$inferSelect;

// Relations
export const bgmsRelations = relations(bgms, ({ many }) => ({
  playlistItems: many(playlistItems),
}));

export const playlistsRelations = relations(playlists, ({ many }) => ({
  items: many(playlistItems),
}));

export const playlistItemsRelations = relations(playlistItems, ({ one }) => ({
  playlist: one(playlists, {
    fields: [playlistItems.playlistId],
    references: [playlists.id],
  }),
  bgm: one(bgms, {
    fields: [playlistItems.bgmId],
    references: [bgms.id],
  }),
}));
