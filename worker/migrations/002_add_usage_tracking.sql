-- Add usage tracking fields to bgms table
ALTER TABLE bgms ADD COLUMN provider TEXT;
ALTER TABLE bgms ADD COLUMN generation_duration_seconds REAL;
ALTER TABLE bgms ADD COLUMN generation_cost_usd REAL;

-- Create usage stats table for summary display
CREATE TABLE IF NOT EXISTS usage_stats (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider TEXT NOT NULL,
  total_generations INTEGER DEFAULT 0,
  total_duration_seconds REAL DEFAULT 0,
  total_cost_usd REAL DEFAULT 0,
  last_updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Initialize usage stats
INSERT OR IGNORE INTO usage_stats (id, provider) VALUES (1, 'elevenlabs');
INSERT OR IGNORE INTO usage_stats (id, provider) VALUES (2, 'replicate');
