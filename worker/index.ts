// Cloudflare Worker - Hono API for Ambient BGM
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// Types
interface Env {
  DB: D1Database;
  OPENAI_API_KEY: string;
  ELEVENLABS_API_KEY?: string;
  SESSION_SECRET: string;
  ASSETS: Fetcher;
}

interface Session {
  userId: string | null;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface BGM {
  id: number;
  user_id: string | null;
  title: string;
  description: string;
  mood: string;
  genre: string;
  tempo: string;
  weather_condition: string;
  time_of_day: string;
  is_favorite: number;
  audio_url: string | null;
  created_at: number;
}

interface User {
  id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  profile_image_url: string | null;
  created_at: number;
  updated_at: number;
}

// Zod schemas
const weatherDataSchema = z.object({
  condition: z.enum(['sunny', 'cloudy', 'rainy', 'snowy', 'stormy', 'foggy', 'windy', 'clear']),
  temperature: z.number(),
  humidity: z.number().optional(),
  description: z.string(),
  location: z.string(),
});

const generateBgmSchema = z.object({
  weather: weatherDataSchema,
  timeOfDay: z.enum(['morning', 'afternoon', 'evening', 'night']),
  preferredGenre: z.enum(['auto', 'lo-fi', 'jazz', 'classical', 'electronic', 'ambient', 'acoustic', 'piano']).optional().default('auto'),
});

const createPlaylistSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

// Create Hono app
const app = new Hono<{ Bindings: Env }>();

// CORS middleware
app.use('/api/*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Session helpers
const SESSION_COOKIE_NAME = 'ambient_bgm_session';
const SESSION_EXPIRY_DAYS = 7;

function generateSessionId(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

async function hashString(str: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(str));
  return Array.from(new Uint8Array(signature), b => b.toString(16).padStart(2, '0')).join('');
}

async function getSession(c: any): Promise<Session | null> {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  if (!sessionId) return null;
  
  try {
    const hashedId = await hashString(sessionId, c.env.SESSION_SECRET);
    const now = Math.floor(Date.now() / 1000);
    const result = await c.env.DB.prepare(
      'SELECT sess FROM sessions WHERE sid = ? AND expire > ?'
    ).bind(hashedId, now).first<{ sess: string }>();
    
    if (!result) return null;
    return JSON.parse(result.sess);
  } catch (error) {
    console.error('Error getting session:', error);
    return null;
  }
}

// Auth routes
app.get('/api/auth/user', async (c) => {
  const session = await getSession(c);
  
  if (!session?.userId) {
    return c.json({ success: true, data: null });
  }
  
  return c.json({
    success: true,
    data: {
      id: session.userId,
      email: session.email,
      firstName: session.firstName,
      lastName: session.lastName,
      profileImageUrl: session.profileImageUrl,
    },
  });
});

app.post('/api/auth/logout', async (c) => {
  const sessionId = getCookie(c, SESSION_COOKIE_NAME);
  
  if (sessionId) {
    try {
      const hashedId = await hashString(sessionId, c.env.SESSION_SECRET);
      await c.env.DB.prepare('DELETE FROM sessions WHERE sid = ?').bind(hashedId).run();
    } catch (error) {
      console.error('Error destroying session:', error);
    }
  }
  
  deleteCookie(c, SESSION_COOKIE_NAME, { path: '/' });
  return c.json({ success: true });
});

// Demo login for testing (creates a demo user session)
app.post('/api/auth/demo-login', async (c) => {
  const db = c.env.DB;
  const demoUserId = 'demo-user-001';
  
  try {
    // Create or get demo user
    await db.prepare(
      `INSERT OR IGNORE INTO users (id, email, first_name, last_name)
       VALUES (?, ?, ?, ?)`
    ).bind(demoUserId, 'demo@example.com', 'Demo', 'User').run();
    
    // Create session
    const sessionId = generateSessionId();
    const hashedId = await hashString(sessionId, c.env.SESSION_SECRET);
    const expireTime = Math.floor(Date.now() / 1000) + (SESSION_EXPIRY_DAYS * 24 * 60 * 60);
    
    const sessionData: Session = {
      userId: demoUserId,
      email: 'demo@example.com',
      firstName: 'Demo',
      lastName: 'User',
      profileImageUrl: null,
    };
    
    await db.prepare(
      'INSERT OR REPLACE INTO sessions (sid, sess, expire) VALUES (?, ?, ?)'
    ).bind(hashedId, JSON.stringify(sessionData), expireTime).run();
    
    setCookie(c, SESSION_COOKIE_NAME, sessionId, {
      httpOnly: true,
      secure: true,
      sameSite: 'Lax',
      path: '/',
      maxAge: SESSION_EXPIRY_DAYS * 24 * 60 * 60,
    });
    
    return c.json({
      success: true,
      data: {
        id: demoUserId,
        email: 'demo@example.com',
        firstName: 'Demo',
        lastName: 'User',
        profileImageUrl: null,
      },
    });
  } catch (error) {
    console.error('Demo login error:', error);
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

// Helper function to transform BGM from DB to API format
function transformBgm(row: any): any {
  // Handle both epoch (integer) and ISO string timestamps
  let createdAt: string;
  if (typeof row.created_at === 'number') {
    createdAt = new Date(row.created_at * 1000).toISOString();
  } else if (typeof row.created_at === 'string') {
    // If it's already an ISO-like string from SQLite datetime()
    createdAt = row.created_at.endsWith('Z') ? row.created_at : `${row.created_at}Z`;
  } else {
    createdAt = new Date().toISOString();
  }
  
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description,
    mood: row.mood,
    genre: row.genre,
    tempo: row.tempo,
    weatherCondition: row.weather_condition,
    timeOfDay: row.time_of_day,
    isFavorite: row.is_favorite === 1,
    audioUrl: row.audio_url,
    createdAt,
  };
}

// Weather API (proxy to Open-Meteo)
app.get('/api/weather', async (c) => {
  const lat = c.req.query('lat');
  const lon = c.req.query('lon');
  const city = c.req.query('city');

  try {
    let latitude: number;
    let longitude: number;
    let locationName: string;

    if (city) {
      // Geocode city name
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`
      );
      const geoData = await geoRes.json() as any;
      
      if (!geoData.results || geoData.results.length === 0) {
        return c.json({ success: false, error: 'City not found' }, 404);
      }
      
      latitude = geoData.results[0].latitude;
      longitude = geoData.results[0].longitude;
      locationName = `${geoData.results[0].name}, ${geoData.results[0].country}`;
    } else if (lat && lon) {
      latitude = parseFloat(lat);
      longitude = parseFloat(lon);
      locationName = 'Current Location';
      
      // Reverse geocode
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${latitude},${longitude}&count=1`
      );
      const geoData = await geoRes.json() as any;
      if (geoData.results?.length > 0) {
        locationName = `${geoData.results[0].name}, ${geoData.results[0].country}`;
      }
    } else {
      return c.json({ success: false, error: 'Please provide lat/lon or city' }, 400);
    }

    // Get weather data
    const weatherRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,relative_humidity_2m,weather_code`
    );
    const weatherData = await weatherRes.json() as any;

    const weatherCode = weatherData.current.weather_code;
    let condition: string;
    let description: string;

    if (weatherCode === 0) {
      condition = 'clear';
      description = 'Clear sky';
    } else if (weatherCode <= 3) {
      condition = 'cloudy';
      description = 'Partly cloudy';
    } else if (weatherCode <= 48) {
      condition = 'foggy';
      description = 'Foggy';
    } else if (weatherCode <= 67) {
      condition = 'rainy';
      description = 'Rainy';
    } else if (weatherCode <= 77) {
      condition = 'snowy';
      description = 'Snowy';
    } else if (weatherCode <= 82) {
      condition = 'rainy';
      description = 'Rain showers';
    } else if (weatherCode <= 86) {
      condition = 'snowy';
      description = 'Snow showers';
    } else {
      condition = 'stormy';
      description = 'Thunderstorm';
    }

    return c.json({
      success: true,
      data: {
        condition,
        temperature: Math.round(weatherData.current.temperature_2m),
        humidity: weatherData.current.relative_humidity_2m,
        description,
        location: locationName,
      },
    });
  } catch (error) {
    console.error('Weather API error:', error);
    return c.json({ success: false, error: 'Failed to fetch weather' }, 500);
  }
});

// Generate BGM
app.post('/api/bgm/generate', zValidator('json', generateBgmSchema), async (c) => {
  const { weather, timeOfDay, preferredGenre } = c.req.valid('json');
  const db = c.env.DB;

  try {
    // Generate BGM description using OpenAI
    const prompt = `Generate a unique ambient background music description for work/focus based on:
- Weather: ${weather.condition}, ${weather.temperature}°C, ${weather.description}
- Time of day: ${timeOfDay}
- Preferred genre: ${preferredGenre === 'auto' ? 'any suitable genre' : preferredGenre}

Respond in JSON format:
{
  "title": "Creative title",
  "description": "2-3 sentence description of the music",
  "mood": "One or two word mood description",
  "genre": "Specific sub-genre",
  "tempo": "slow/moderate/upbeat"
}`;

    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${c.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      }),
    });

    if (!openaiRes.ok) {
      // Fallback if OpenAI fails
      const fallback = {
        title: `${weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)} ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Vibes`,
        description: `Perfect ambient music for a ${weather.condition} ${timeOfDay}. Let the sounds help you focus and stay productive.`,
        mood: 'Focused & Calm',
        genre: preferredGenre === 'auto' ? 'Ambient' : preferredGenre,
        tempo: 'moderate',
      };

      const result = await db.prepare(
        `INSERT INTO bgms (title, description, mood, genre, tempo, weather_condition, time_of_day)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         RETURNING *`
      ).bind(
        fallback.title,
        fallback.description,
        fallback.mood,
        fallback.genre,
        fallback.tempo,
        weather.condition,
        timeOfDay
      ).first();

      return c.json({ success: true, data: transformBgm(result) });
    }

    const openaiData = await openaiRes.json() as any;
    const bgmData = JSON.parse(openaiData.choices[0].message.content);

    const result = await db.prepare(
      `INSERT INTO bgms (title, description, mood, genre, tempo, weather_condition, time_of_day)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       RETURNING *`
    ).bind(
      bgmData.title,
      bgmData.description,
      bgmData.mood,
      bgmData.genre,
      bgmData.tempo,
      weather.condition,
      timeOfDay
    ).first();

    return c.json({ success: true, data: transformBgm(result) });
  } catch (error) {
    console.error('BGM generation error:', error);
    return c.json({ success: false, error: 'Failed to generate BGM' }, 500);
  }
});

// Get all BGMs
app.get('/api/bgm', async (c) => {
  const db = c.env.DB;
  
  try {
    const results = await db.prepare(
      'SELECT * FROM bgms ORDER BY created_at DESC'
    ).all();
    
    return c.json({
      success: true,
      data: results.results.map(transformBgm),
    });
  } catch (error) {
    console.error('Error fetching BGMs:', error);
    return c.json({ success: false, error: 'Failed to fetch BGMs' }, 500);
  }
});

// Get single BGM
app.get('/api/bgm/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  try {
    const result = await db.prepare('SELECT * FROM bgms WHERE id = ?').bind(id).first();
    
    if (!result) {
      return c.json({ success: false, error: 'BGM not found' }, 404);
    }
    
    return c.json({ success: true, data: transformBgm(result) });
  } catch (error) {
    console.error('Error fetching BGM:', error);
    return c.json({ success: false, error: 'Failed to fetch BGM' }, 500);
  }
});

// Delete BGM
app.delete('/api/bgm/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  try {
    await db.prepare('DELETE FROM playlist_items WHERE bgm_id = ?').bind(id).run();
    const result = await db.prepare('DELETE FROM bgms WHERE id = ? RETURNING id').bind(id).first();
    
    if (!result) {
      return c.json({ success: false, error: 'BGM not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting BGM:', error);
    return c.json({ success: false, error: 'Failed to delete BGM' }, 500);
  }
});

// Toggle favorite
app.post('/api/bgm/:id/favorite', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  try {
    const result = await db.prepare(
      'UPDATE bgms SET is_favorite = NOT is_favorite WHERE id = ? RETURNING *'
    ).bind(id).first();
    
    if (!result) {
      return c.json({ success: false, error: 'BGM not found' }, 404);
    }
    
    return c.json({ success: true, data: transformBgm(result) });
  } catch (error) {
    console.error('Error toggling favorite:', error);
    return c.json({ success: false, error: 'Failed to toggle favorite' }, 500);
  }
});

// Generate audio for BGM using ElevenLabs
app.post('/api/bgm/:id/audio', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  // Check if ElevenLabs is configured
  if (!c.env.ELEVENLABS_API_KEY) {
    return c.json({ 
      success: false, 
      error: 'ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY.' 
    }, 503);
  }
  
  try {
    // Get the BGM
    const bgm = await db.prepare('SELECT * FROM bgms WHERE id = ?').bind(id).first<any>();
    
    if (!bgm) {
      return c.json({ success: false, error: 'BGM not found' }, 404);
    }
    
    // Check if audio already exists
    if (bgm.audio_url) {
      return c.json({ success: true, data: transformBgm(bgm) });
    }
    
    // Create music prompt from BGM description
    const musicPrompt = `${bgm.genre} music. ${bgm.description}. Mood: ${bgm.mood}. Tempo: ${bgm.tempo}. Perfect for ${bgm.weather_condition} weather during ${bgm.time_of_day}. Instrumental only, no vocals.`;
    
    // Generate music with ElevenLabs
    const response = await fetch('https://api.elevenlabs.io/v1/music/compose', {
      method: 'POST',
      headers: {
        'xi-api-key': c.env.ELEVENLABS_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: musicPrompt,
        duration_seconds: 30,
        output_format: 'mp3_44100_128',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('ElevenLabs error:', errorText);
      return c.json({ 
        success: false, 
        error: 'Failed to generate audio. Please try again.' 
      }, 500);
    }
    
    // Get audio data
    const audioBuffer = await response.arrayBuffer();
    const base64Audio = btoa(String.fromCharCode(...new Uint8Array(audioBuffer)));
    const audioDataUrl = `data:audio/mpeg;base64,${base64Audio}`;
    
    // Update BGM with audio URL
    const updatedBgm = await db.prepare(
      'UPDATE bgms SET audio_url = ? WHERE id = ? RETURNING *'
    ).bind(audioDataUrl, id).first();
    
    return c.json({ success: true, data: transformBgm(updatedBgm) });
  } catch (error) {
    console.error('Audio generation error:', error);
    return c.json({ success: false, error: 'Failed to generate audio' }, 500);
  }
});

// Get favorites
app.get('/api/favorites', async (c) => {
  const db = c.env.DB;
  
  try {
    const results = await db.prepare(
      'SELECT * FROM bgms WHERE is_favorite = 1 ORDER BY created_at DESC'
    ).all();
    
    return c.json({
      success: true,
      data: results.results.map(transformBgm),
    });
  } catch (error) {
    console.error('Error fetching favorites:', error);
    return c.json({ success: false, error: 'Failed to fetch favorites' }, 500);
  }
});

// Music service status
app.get('/api/music/status', async (c) => {
  return c.json({
    success: true,
    data: {
      configured: !!c.env.ELEVENLABS_API_KEY,
    },
  });
});

// Playlists
app.get('/api/playlists', async (c) => {
  const db = c.env.DB;
  
  try {
    const results = await db.prepare(
      'SELECT * FROM playlists ORDER BY created_at DESC'
    ).all();
    
    return c.json({ success: true, data: results.results });
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return c.json({ success: false, error: 'Failed to fetch playlists' }, 500);
  }
});

app.post('/api/playlists', zValidator('json', createPlaylistSchema), async (c) => {
  const db = c.env.DB;
  const { name, description } = c.req.valid('json');
  
  try {
    const result = await db.prepare(
      'INSERT INTO playlists (name, description) VALUES (?, ?) RETURNING *'
    ).bind(name, description || null).first();
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating playlist:', error);
    return c.json({ success: false, error: 'Failed to create playlist' }, 500);
  }
});

app.delete('/api/playlists/:id', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  try {
    await db.prepare('DELETE FROM playlist_items WHERE playlist_id = ?').bind(id).run();
    const result = await db.prepare('DELETE FROM playlists WHERE id = ? RETURNING id').bind(id).first();
    
    if (!result) {
      return c.json({ success: false, error: 'Playlist not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting playlist:', error);
    return c.json({ success: false, error: 'Failed to delete playlist' }, 500);
  }
});

app.get('/api/playlists/:id/items', async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  
  try {
    const results = await db.prepare(
      `SELECT b.* FROM bgms b
       INNER JOIN playlist_items pi ON b.id = pi.bgm_id
       WHERE pi.playlist_id = ?
       ORDER BY pi.position`
    ).bind(id).all();
    
    return c.json({
      success: true,
      data: results.results.map(transformBgm),
    });
  } catch (error) {
    console.error('Error fetching playlist items:', error);
    return c.json({ success: false, error: 'Failed to fetch playlist items' }, 500);
  }
});

app.post('/api/playlists/:playlistId/items/:bgmId', async (c) => {
  const db = c.env.DB;
  const playlistId = parseInt(c.req.param('playlistId'));
  const bgmId = parseInt(c.req.param('bgmId'));
  
  try {
    const count = await db.prepare(
      'SELECT COUNT(*) as count FROM playlist_items WHERE playlist_id = ?'
    ).bind(playlistId).first() as any;
    
    const result = await db.prepare(
      'INSERT INTO playlist_items (playlist_id, bgm_id, position) VALUES (?, ?, ?) RETURNING *'
    ).bind(playlistId, bgmId, count.count).first();
    
    return c.json({ success: true, data: result });
  } catch (error) {
    console.error('Error adding to playlist:', error);
    return c.json({ success: false, error: 'Failed to add to playlist' }, 500);
  }
});

app.delete('/api/playlists/:playlistId/items/:bgmId', async (c) => {
  const db = c.env.DB;
  const playlistId = parseInt(c.req.param('playlistId'));
  const bgmId = parseInt(c.req.param('bgmId'));
  
  try {
    const result = await db.prepare(
      'DELETE FROM playlist_items WHERE playlist_id = ? AND bgm_id = ? RETURNING id'
    ).bind(playlistId, bgmId).first();
    
    if (!result) {
      return c.json({ success: false, error: 'Item not found' }, 404);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing from playlist:', error);
    return c.json({ success: false, error: 'Failed to remove from playlist' }, 500);
  }
});

// Catch-all for static assets
app.all('*', async (c) => {
  return c.env.ASSETS.fetch(c.req.raw);
});

export default app;
