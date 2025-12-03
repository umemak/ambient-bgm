-- D1 Database Schema for Ambient BGM

-- Sessions table for authentication
CREATE TABLE IF NOT EXISTS sessions (
  sid TEXT PRIMARY KEY,
  sess TEXT NOT NULL,
  expire INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_session_expire ON sessions(expire);

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  first_name TEXT,
  last_name TEXT,
  profile_image_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- BGMs table
CREATE TABLE IF NOT EXISTS bgms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mood TEXT NOT NULL,
  genre TEXT NOT NULL,
  tempo TEXT NOT NULL,
  weather_condition TEXT NOT NULL,
  time_of_day TEXT NOT NULL,
  is_favorite INTEGER DEFAULT 0,
  audio_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Playlists table
CREATE TABLE IF NOT EXISTS playlists (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT,
  name TEXT NOT NULL,
  description TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Playlist items table
CREATE TABLE IF NOT EXISTS playlist_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  playlist_id INTEGER NOT NULL,
  bgm_id INTEGER NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
  FOREIGN KEY (bgm_id) REFERENCES bgms(id) ON DELETE CASCADE,
  UNIQUE(playlist_id, bgm_id)
);
