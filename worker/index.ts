// Cloudflare Worker - Hono API for Ambient BGM
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { zValidator } from '@hono/zod-validator';
import { z } from 'zod';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

// Types
interface Env {
  DB: D1Database;
  AI: any; // Cloudflare Workers AI binding
  MUSIC_BUCKET: R2Bucket; // R2 storage for music files
  ELEVENLABS_API_KEY?: string;
  REPLICATE_API_TOKEN?: string;
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
  preferredGenre: z.enum(['auto', 'lo-fi', 'jazz', 'classical', 'electronic', 'ambient', 'acoustic', 'piano', 'house', 'techno', 'dnb', 'edm', 'funk', 'disco', 'rock', 'indie']).optional().default('auto'),
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
    return c.json(null);
  }
  
  return c.json({
    id: session.userId,
    email: session.email,
    firstName: session.firstName,
    lastName: session.lastName,
    profileImageUrl: session.profileImageUrl,
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

// Login endpoint with username/password
app.post('/api/auth/login', zValidator('json', z.object({
  username: z.string().min(1),
  password: z.string().min(1),
})), async (c) => {
  const { username, password } = c.req.valid('json');
  const db = c.env.DB;
  
  // Fixed credentials for now
  const VALID_USERNAME = 'testuser';
  const VALID_PASSWORD = 'testpassword0';
  
  if (username !== VALID_USERNAME || password !== VALID_PASSWORD) {
    return c.json({ error: 'Invalid username or password' }, 401);
  }
  
  try {
    const userId = 'test-user-001';
    
    // Create or get user
    await db.prepare(
      `INSERT OR IGNORE INTO users (id, email, first_name, last_name)
       VALUES (?, ?, ?, ?)`
    ).bind(userId, 'testuser@example.com', 'Test', 'User').run();
    
    // Create session
    const sessionId = generateSessionId();
    const hashedId = await hashString(sessionId, c.env.SESSION_SECRET);
    const expireTime = Math.floor(Date.now() / 1000) + (SESSION_EXPIRY_DAYS * 24 * 60 * 60);
    
    const sessionData: Session = {
      userId: userId,
      email: 'testuser@example.com',
      firstName: 'Test',
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
      id: userId,
      email: 'testuser@example.com',
      firstName: 'Test',
      lastName: 'User',
      profileImageUrl: null,
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: 'Login failed' }, 500);
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

// Weather API (using wttr.in - no API key required!)
app.get('/api/weather', async (c) => {
  const city = c.req.query('city');
  
  // If no city provided, use IP-based location from Cloudflare
  const locationQuery = city || c.req.header('CF-IPCountry') || 'auto';

  try {
    // Get weather data from wttr.in
    const weatherRes = await fetch(
      `https://wttr.in/${encodeURIComponent(locationQuery)}?format=j1`,
      {
        headers: {
          'User-Agent': 'curl/7.68.0', // wttr.in likes curl user agent
        },
      }
    );
    
    if (!weatherRes.ok) {
      throw new Error(`Weather API returned ${weatherRes.status}`);
    }
    
    const weatherData = await weatherRes.json() as any;
    
    if (!weatherData.current_condition || weatherData.current_condition.length === 0) {
      throw new Error('Invalid weather data format');
    }

    const current = weatherData.current_condition[0];
    const location = weatherData.nearest_area?.[0];
    
    // Map wttr.in weather codes to our conditions
    const weatherDesc = current.weatherDesc?.[0]?.value?.toLowerCase() || '';
    let condition: string;
    
    if (weatherDesc.includes('sunny') || weatherDesc.includes('clear')) {
      condition = 'clear';
    } else if (weatherDesc.includes('cloud') || weatherDesc.includes('overcast')) {
      condition = 'cloudy';
    } else if (weatherDesc.includes('rain') || weatherDesc.includes('drizzle')) {
      condition = 'rainy';
    } else if (weatherDesc.includes('snow') || weatherDesc.includes('sleet')) {
      condition = 'snowy';
    } else if (weatherDesc.includes('thunder') || weatherDesc.includes('storm')) {
      condition = 'stormy';
    } else if (weatherDesc.includes('fog') || weatherDesc.includes('mist')) {
      condition = 'foggy';
    } else if (weatherDesc.includes('wind')) {
      condition = 'windy';
    } else {
      condition = 'clear';
    }

    const locationName = location 
      ? `${location.areaName?.[0]?.value || 'Unknown'}, ${location.country?.[0]?.value || 'Unknown'}`
      : city || 'Your Location';

    return c.json({
      success: true,
      data: {
        condition,
        temperature: parseInt(current.temp_C || '20'),
        humidity: parseInt(current.humidity || '50'),
        description: current.weatherDesc?.[0]?.value || 'Clear',
        location: locationName,
      },
    });
  } catch (error: any) {
    console.error('Weather API error:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch weather',
      details: error?.message || String(error)
    }, 500);
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

IMPORTANT: Choose tempo based on these guidelines:
- "slow" (60-80 BPM): For calm, rainy, nighttime, or very cold weather. Relaxing, meditative music.
- "moderate" (80-120 BPM): For cloudy, mild weather, morning/afternoon. Balanced, focus-oriented music.
- "upbeat" (120-140 BPM): For sunny, clear weather, or energetic genres. Active, motivating music.

Respond ONLY with valid JSON (no markdown, no code blocks):
{
  "title": "Creative title",
  "description": "2-3 sentence description of the music",
  "mood": "One or two word mood description",
  "genre": "Specific sub-genre",
  "tempo": "slow/moderate/upbeat"
}`;

    // Use Cloudflare Workers AI
    let bgmData;
    try {
      const aiResponse = await c.env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
        messages: [
          { role: 'system', content: 'You are a music expert. Always respond with valid JSON only, no markdown or extra text.' },
          { role: 'user', content: prompt }
        ],
      });
      
      // Parse AI response
      const responseText = aiResponse.response || JSON.stringify(aiResponse);
      console.log('AI Response:', responseText);
      
      // Remove markdown code blocks if present
      const cleanedText = responseText.replace(/```json\n?|```\n?/g, '').trim();
      bgmData = JSON.parse(cleanedText);
      
      console.log('Parsed BGM data:', JSON.stringify(bgmData));
      
      // Validate tempo field
      if (!bgmData.tempo || !['slow', 'moderate', 'upbeat'].includes(bgmData.tempo)) {
        console.warn('Invalid tempo value, using default based on conditions');
        // Determine tempo based on weather and time
        if (weather.condition === 'rainy' || weather.condition === 'snowy' || timeOfDay === 'night') {
          bgmData.tempo = 'slow';
        } else if (weather.condition === 'sunny' || weather.condition === 'clear' || timeOfDay === 'morning') {
          bgmData.tempo = 'upbeat';
        } else {
          bgmData.tempo = 'moderate';
        }
      }
    } catch (error) {
      console.error('Cloudflare AI error:', error);
      // Fallback if AI fails
      // Determine tempo based on weather and time
      let tempo = 'moderate';
      if (weather.condition === 'rainy' || weather.condition === 'snowy' || timeOfDay === 'night') {
        tempo = 'slow';
      } else if (weather.condition === 'sunny' || weather.condition === 'clear' || timeOfDay === 'morning') {
        tempo = 'upbeat';
      }
      
      const fallback = {
        title: `${weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1)} ${timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1)} Vibes`,
        description: `Perfect ambient music for a ${weather.condition} ${timeOfDay}. Let the sounds help you focus and stay productive.`,
        mood: 'Focused & Calm',
        genre: preferredGenre === 'auto' ? 'Ambient' : preferredGenre,
        tempo: tempo,
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

// Generate audio for BGM using selected provider
app.post('/api/bgm/:id/audio', zValidator('json', z.object({
  provider: z.enum(['elevenlabs', 'replicate']).optional().default('elevenlabs'),
  duration: z.number().min(10).max(300).optional().default(30),
})), async (c) => {
  const db = c.env.DB;
  const id = parseInt(c.req.param('id'));
  const { provider, duration } = c.req.valid('json');
  
  // Validate duration based on provider
  if (provider === 'elevenlabs' && (duration < 10 || duration > 300)) {
    return c.json({ 
      success: false, 
      error: 'ElevenLabs duration must be between 10 and 300 seconds' 
    }, 400);
  }
  
  if (provider === 'replicate' && (duration < 1 || duration > 190)) {
    return c.json({ 
      success: false, 
      error: 'Replicate MusicGen duration must be between 1 and 190 seconds' 
    }, 400);
  }
  
  // Check if selected provider is configured
  if (provider === 'elevenlabs' && !c.env.ELEVENLABS_API_KEY) {
    return c.json({ 
      success: false, 
      error: 'ElevenLabs API key not configured. Please set ELEVENLABS_API_KEY.' 
    }, 503);
  }
  
  if (provider === 'replicate' && !c.env.REPLICATE_API_TOKEN) {
    return c.json({ 
      success: false, 
      error: 'Replicate API token not configured. Please set REPLICATE_API_TOKEN.' 
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
    
    let audioBuffer: ArrayBuffer;
    let fileName: string;
    
    if (provider === 'replicate') {
      // Generate music with Replicate MusicGen
      const predictionResponse = await fetch('https://api.replicate.com/v1/predictions', {
        method: 'POST',
        headers: {
          'Authorization': `Token ${c.env.REPLICATE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          version: 'b05b1dff1d8c6dc63d14b0cdb42135378dcb87f6373b0d3d341ede46e59e2b38',
          input: {
            prompt: musicPrompt,
            duration: duration,
            model_version: 'stereo-large',
            output_format: 'mp3',
            normalization_strategy: 'loudness',
          }
        })
      });
      
      if (!predictionResponse.ok) {
        const errorText = await predictionResponse.text();
        console.error('Replicate prediction error:', predictionResponse.status, errorText);
        return c.json({ 
          success: false, 
          error: `Failed to start music generation: ${predictionResponse.status}`,
          details: errorText
        }, predictionResponse.status);
      }
      
      const prediction = await predictionResponse.json();
      const predictionId = prediction.id;
      
      // Poll for completion (max 5 minutes)
      let attempts = 0;
      const maxAttempts = 60; // 5 minutes with 5-second intervals
      let finalPrediction: any;
      
      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
        
        const statusResponse = await fetch(
          `https://api.replicate.com/v1/predictions/${predictionId}`,
          {
            headers: {
              'Authorization': `Token ${c.env.REPLICATE_API_TOKEN}`,
            }
          }
        );
        
        if (!statusResponse.ok) {
          throw new Error(`Failed to check prediction status: ${statusResponse.status}`);
        }
        
        finalPrediction = await statusResponse.json();
        
        if (finalPrediction.status === 'succeeded') {
          break;
        } else if (finalPrediction.status === 'failed' || finalPrediction.status === 'canceled') {
          throw new Error(`Music generation failed: ${finalPrediction.error || 'Unknown error'}`);
        }
        
        attempts++;
      }
      
      if (attempts >= maxAttempts) {
        throw new Error('Music generation timed out');
      }
      
      // Download the generated audio
      const audioUrl = finalPrediction.output;
      if (!audioUrl) {
        throw new Error('No audio URL in prediction output');
      }
      
      const audioResponse = await fetch(audioUrl);
      if (!audioResponse.ok) {
        throw new Error(`Failed to download audio: ${audioResponse.status}`);
      }
      
      audioBuffer = await audioResponse.arrayBuffer();
      fileName = `bgm_${id}_replicate_${Date.now()}.mp3`;
      
    } else {
      // Generate music with ElevenLabs Music Generation API
      const response = await fetch('https://api.elevenlabs.io/v1/music', {
        method: 'POST',
        headers: {
          'xi-api-key': c.env.ELEVENLABS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: musicPrompt,
          musicLengthMs: duration * 1000, // Convert to milliseconds
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('ElevenLabs error:', response.status, errorText);
        
        let errorMsg = 'Failed to generate audio. ';
        if (response.status === 401) {
          errorMsg += 'Invalid API key.';
        } else if (response.status === 402) {
          errorMsg += 'Insufficient credits.';
        } else if (response.status === 400) {
          errorMsg += 'Invalid request parameters.';
        } else {
          errorMsg += `Error ${response.status}`;
        }
        
        return c.json({ 
          success: false, 
          error: errorMsg,
          details: errorText
        }, response.status);
      }
      
      audioBuffer = await response.arrayBuffer();
      fileName = `bgm_${id}_elevenlabs_${Date.now()}.mp3`;
    }
    
    // Upload to R2
    await c.env.MUSIC_BUCKET.put(fileName, audioBuffer, {
      httpMetadata: {
        contentType: 'audio/mpeg',
      },
    });
    
    // Store R2 file reference in database
    const audioUrl = `/api/music/${fileName}`;
    const updatedBgm = await db.prepare(
      'UPDATE bgms SET audio_url = ? WHERE id = ? RETURNING *'
    ).bind(audioUrl, id).first();
    
    return c.json({ 
      success: true, 
      data: transformBgm(updatedBgm),
      message: `Music generated with ${provider === 'replicate' ? 'Replicate MusicGen' : 'ElevenLabs'} and stored successfully!`,
      provider: provider,
      duration: duration
    });
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
  const elevenlabsKey = c.env.ELEVENLABS_API_KEY;
  const replicateToken = c.env.REPLICATE_API_TOKEN;
  
  const providers: any = {
    elevenlabs: {
      configured: !!elevenlabsKey,
      available: !!elevenlabsKey,
    },
    replicate: {
      configured: !!replicateToken,
      available: !!replicateToken,
    },
  };
  
  if (!elevenlabsKey && !replicateToken) {
    return c.json({
      success: true,
      data: {
        providers,
      },
    });
  }

  try {
    // Fetch user subscription info from ElevenLabs if configured
    if (elevenlabsKey) {
      try {
        const response = await fetch('https://api.elevenlabs.io/v1/user/subscription', {
          headers: {
            'xi-api-key': elevenlabsKey,
          },
        });

        if (response.ok) {
          const subscriptionData = await response.json();
          providers.elevenlabs.subscription = {
            tier: subscriptionData.tier || 'unknown',
            characterCount: subscriptionData.character_count || 0,
            characterLimit: subscriptionData.character_limit || 0,
            canExtendCharacterLimit: subscriptionData.can_extend_character_limit || false,
            allowedToExtendCharacterLimit: subscriptionData.allowed_to_extend_character_limit || false,
            nextCharacterCountResetUnix: subscriptionData.next_character_count_reset_unix || 0,
            status: subscriptionData.status || 'unknown',
          };
        }
      } catch (error) {
        console.error('Failed to fetch ElevenLabs subscription:', error);
      }
    }
    
    return c.json({
      success: true,
      data: {
        providers,
      },
    });
  } catch (error) {
    console.error('Failed to fetch music service status:', error);
    return c.json({
      success: true,
      data: {
        providers,
      },
    });
  }
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

// Get music file from R2
app.get('/api/music/:filename', async (c) => {
  const filename = c.req.param('filename');
  
  try {
    const object = await c.env.MUSIC_BUCKET.get(filename);
    
    if (!object) {
      return c.json({ success: false, error: 'Music file not found' }, 404);
    }
    
    const headers = new Headers();
    headers.set('Content-Type', 'audio/mpeg');
    headers.set('Cache-Control', 'public, max-age=31536000'); // Cache for 1 year
    
    return new Response(object.body, { headers });
  } catch (error) {
    console.error('Error fetching music file:', error);
    return c.json({ success: false, error: 'Failed to fetch music file' }, 500);
  }
});

// Catch-all for static assets
app.all('*', async (c) => {
  // If ASSETS binding exists, use it
  if (c.env.ASSETS) {
    return c.env.ASSETS.fetch(c.req.raw);
  }
  
  // Otherwise return 404
  return c.json({ 
    success: false, 
    error: 'Not found',
    message: 'Please configure static assets or access API endpoints directly'
  }, 404);
});

export default app;
