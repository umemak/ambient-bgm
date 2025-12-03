# Ambient BGM - Weather-Based Work Music App

## Overview
A web application that generates work-suitable BGM (background music) based on the current weather and time of day. The app uses AI to create unique ambient music descriptions that match the user's environment, and can generate actual music using ElevenLabs Music API.

## Key Features
- **User Authentication**: Cookie-based session authentication
- **Location Detection**: Auto-detect via browser GPS or manual city input
- **Weather Integration**: Real-time weather data from Open-Meteo API (free, no key required)
- **AI BGM Generation**: Uses OpenAI to generate creative BGM descriptions based on weather + time
- **Music Generation**: ElevenLabs Music API for actual audio generation (requires paid API key)
- **Audio Download**: Download generated music files as MP3
- **Genre Selection**: Choose from Lo-Fi, Jazz, Classical, Electronic, Ambient, Acoustic, Piano, or Auto
- **Favorites**: Mark BGMs as favorites with heart icon toggle
- **Playlists**: Create custom playlists and add/remove tracks
- **Atmospheric UI**: Weather-responsive backgrounds with rain, snow, stars effects
- **Theme Support**: Light, dark, and system theme options
- **Glass Morphism Design**: Modern frosted-glass UI components

## Tech Stack

### Development (Replit)
- **Frontend**: React 18 + TypeScript, Tailwind CSS, Shadcn UI, Wouter routing
- **Backend**: Express.js, OpenAI API (via Replit AI Integrations), ElevenLabs Music API
- **Database**: PostgreSQL with Drizzle ORM
- **APIs**: Open-Meteo (weather), OpenAI GPT-4o-mini (BGM descriptions), ElevenLabs (music generation)

### Production (Cloudflare Workers)
- **Runtime**: Cloudflare Workers (Edge)
- **Framework**: Hono (Express-like for Edge)
- **Database**: Cloudflare D1 (SQLite)
- **Frontend**: Static assets served via Cloudflare

## Project Structure
```
client/
├── src/
│   ├── components/     # UI components
│   │   ├── weather-background.tsx  # Animated weather effects
│   │   ├── player-card.tsx         # Main player UI
│   │   ├── player-controls.tsx     # Playback controls
│   │   ├── bgm-info.tsx           # BGM display with favorite toggle
│   │   ├── weather-display.tsx    # Weather info
│   │   ├── location-settings.tsx  # Location config
│   │   ├── bgm-history.tsx        # History panel
│   │   ├── playlist-manager.tsx   # Playlist management
│   │   ├── genre-selector.tsx     # Music genre selection
│   │   └── theme-toggle.tsx       # Theme switcher
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   └── pages/          # Page components
server/                 # Express.js backend (Replit development)
├── routes.ts          # API endpoints
├── weather.ts         # Open-Meteo integration
├── openai.ts          # BGM description generation
├── elevenlabs.ts      # Music audio generation
├── storage.ts         # Database storage layer
└── db.ts              # Drizzle database connection
worker/                # Cloudflare Workers backend (production)
├── index.ts           # Hono API endpoints
├── schema.sql         # D1 database schema
└── tsconfig.json      # TypeScript config for Workers
shared/
└── schema.ts          # TypeScript types, Zod schemas & Drizzle tables
```

## Database Schema
- **sessions**: User session storage (sid, sess, expire)
- **users**: User accounts (id, email, first_name, last_name, profile_image_url)
- **bgms**: Generated BGM metadata (title, description, mood, genre, tempo, audioUrl, isFavorite)
- **playlists**: User-created playlists
- **playlist_items**: Many-to-many relationship between playlists and BGMs

## API Endpoints
### Authentication
- `GET /api/auth/user` - Get current user
- `POST /api/auth/logout` - Log out
- `POST /api/auth/demo-login` - Demo login (for testing)

### Weather
- `GET /api/weather?lat=&lon=` - Get weather by coordinates
- `GET /api/weather?city=` - Get weather by city name

### BGM
- `POST /api/bgm/generate` - Generate new BGM description
- `GET /api/bgm` - List all generated BGMs
- `GET /api/bgm/:id` - Get single BGM
- `DELETE /api/bgm/:id` - Delete a BGM
- `POST /api/bgm/:id/favorite` - Toggle favorite status

### Favorites
- `GET /api/favorites` - List all favorite BGMs

### Playlists
- `GET /api/playlists` - List all playlists
- `POST /api/playlists` - Create playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `GET /api/playlists/:id/items` - Get playlist tracks
- `POST /api/playlists/:playlistId/items/:bgmId` - Add track to playlist
- `DELETE /api/playlists/:playlistId/items/:bgmId` - Remove track from playlist

### Music Service
- `GET /api/music/status` - Check if ElevenLabs is configured

## Environment Variables

### Replit Development
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key (via Replit AI Integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL (via Replit AI Integrations)
- `ELEVENLABS_API_KEY` - ElevenLabs API key for music generation (optional)
- `SESSION_SECRET` - Session encryption secret

### Cloudflare Workers Production
- `OPENAI_API_KEY` - OpenAI API key (set via `wrangler secret put`)
- `SESSION_SECRET` - Session encryption secret
- `ELEVENLABS_API_KEY` - ElevenLabs API key (optional)

## Deployment

### Replit Development
The workflow `Start application` runs `npm run dev` which starts both:
- Express backend on port 5000
- Vite development server for frontend

### Cloudflare Workers Production
See `DEPLOY-CLOUDFLARE.md` for detailed instructions:
1. `npx wrangler login` - Authenticate
2. `npx wrangler d1 create ambient-bgm-db` - Create D1 database
3. `npx wrangler d1 execute ambient-bgm-db --file=./worker/schema.sql` - Apply schema
4. `npx wrangler secret put OPENAI_API_KEY` - Set secrets
5. `npm run build` - Build frontend
6. `npx wrangler deploy worker/index.ts --assets dist/public` - Deploy

## Recent Changes
- 2024-12: Added Cloudflare Workers deployment with Hono + D1 database
- 2024-12: Added ElevenLabs Music API integration for actual audio generation
- 2024-12: Implemented PostgreSQL database for persistent storage
- 2024-12: Added favorites and playlists features
- 2024-12: Added genre selection (Lo-Fi, Jazz, Classical, Electronic, etc.)
- 2024-12: Initial implementation of Weather-Based Work BGM app

## Notes
- OpenAI is accessed via Replit AI Integrations in development (no API key needed, billed to credits)
- Weather data from Open-Meteo is free and requires no API key
- ElevenLabs Music API requires a paid plan ($5+/month) for audio generation
- Cloudflare Workers Free Tier: 100,000 requests/day
