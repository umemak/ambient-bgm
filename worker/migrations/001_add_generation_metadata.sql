-- Migration: Add generation metadata to bgms table
-- This allows searching for similar music based on input conditions

-- Add columns for input conditions
ALTER TABLE bgms ADD COLUMN temperature REAL;
ALTER TABLE bgms ADD COLUMN weather_description TEXT;
ALTER TABLE bgms ADD COLUMN location TEXT;
ALTER TABLE bgms ADD COLUMN preferred_genre TEXT;

-- Add columns for AI generation metadata
ALTER TABLE bgms ADD COLUMN ai_prompt TEXT;
ALTER TABLE bgms ADD COLUMN music_prompt TEXT;

-- Add index for searching by conditions
CREATE INDEX IF NOT EXISTS idx_bgms_weather_conditions ON bgms(weather_condition, time_of_day, temperature);
CREATE INDEX IF NOT EXISTS idx_bgms_genre_tempo ON bgms(genre, tempo);
CREATE INDEX IF NOT EXISTS idx_bgms_location ON bgms(location);
