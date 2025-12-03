# Ambient BGM - Weather-Based Work Music App

## Overview
A web application that generates work-suitable BGM (background music) based on the current weather and time of day. The app uses AI to create unique ambient music descriptions that match the user's environment, and can generate actual music using ElevenLabs Music API.

## Key Features
- **User Authentication**: Login with Google, GitHub, Apple, or email via Replit Auth
- **Location Detection**: Auto-detect via browser GPS or manual city input
- **Weather Integration**: Real-time weather data from Open-Meteo API (free, no key required)
- **AI BGM Generation**: Uses OpenAI to generate creative BGM descriptions based on weather + time
- **Music Generation**: ElevenLabs Music API for actual audio generation (requires paid API key)
- **Audio Download**: Download generated music files as MP3
- **Genre Selection**: Choose from Lo-Fi, Jazz, Classical, Electronic, Ambient, Acoustic, Piano, or Auto
- **Favorites**: Mark BGMs as favorites with heart icon toggle
- **Playlists**: Create custom playlists and add/remove tracks
- **PostgreSQL Database**: Persistent storage for users, BGMs, favorites, and playlists
- **Atmospheric UI**: Weather-responsive backgrounds with rain, snow, stars effects
- **Theme Support**: Light, dark, and system theme options
- **Glass Morphism Design**: Modern frosted-glass UI components

## Tech Stack
- **Frontend**: React 18 + TypeScript, Tailwind CSS, Shadcn UI, Wouter routing
- **Backend**: Express.js, OpenAI API (via Replit AI Integrations), ElevenLabs Music API
- **Database**: PostgreSQL with Drizzle ORM
- **APIs**: Open-Meteo (weather), OpenAI GPT-5 (BGM descriptions), ElevenLabs (music generation)

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
server/
├── routes.ts          # API endpoints
├── weather.ts         # Open-Meteo integration
├── openai.ts          # BGM description generation
├── elevenlabs.ts      # Music audio generation
├── storage.ts         # Database storage layer
└── db.ts              # Drizzle database connection
shared/
└── schema.ts          # TypeScript types, Zod schemas & Drizzle tables
```

## Database Schema
- **bgms**: Stores generated BGM metadata (title, description, mood, genre, tempo, audioUrl, isFavorite)
- **playlists**: User-created playlists
- **playlist_items**: Many-to-many relationship between playlists and BGMs

## API Endpoints
### Weather
- `GET /api/weather?lat=&lon=` - Get weather by coordinates
- `GET /api/weather?city=` - Get weather by city name

### BGM
- `POST /api/bgm/generate` - Generate new BGM description
- `GET /api/bgm` - List all generated BGMs
- `GET /api/bgm/:id` - Get single BGM
- `DELETE /api/bgm/:id` - Delete a BGM
- `POST /api/bgm/:id/favorite` - Toggle favorite status
- `POST /api/bgm/:id/audio` - Generate audio (requires ElevenLabs API key)

### Favorites
- `GET /api/favorites` - List all favorite BGMs

### Playlists
- `GET /api/playlists` - List all playlists
- `POST /api/playlists` - Create playlist
- `GET /api/playlists/:id` - Get playlist
- `DELETE /api/playlists/:id` - Delete playlist
- `GET /api/playlists/:id/items` - Get playlist tracks
- `POST /api/playlists/:playlistId/items/:bgmId` - Add track to playlist
- `DELETE /api/playlists/:playlistId/items/:bgmId` - Remove track from playlist

### Music Service
- `GET /api/music/status` - Check if ElevenLabs is configured

## Environment Variables
- `DATABASE_URL` - PostgreSQL connection string (auto-provided by Replit)
- `AI_INTEGRATIONS_OPENAI_API_KEY` - OpenAI API key (via Replit AI Integrations)
- `AI_INTEGRATIONS_OPENAI_BASE_URL` - OpenAI base URL (via Replit AI Integrations)
- `ELEVENLABS_API_KEY` - ElevenLabs API key for music generation (optional, requires paid plan)

## Running the App
The workflow `Start application` runs `npm run dev` which starts both:
- Express backend on port 5000
- Vite development server for frontend

## Recent Changes
- 2024-12: Added ElevenLabs Music API integration for actual audio generation
- 2024-12: Implemented PostgreSQL database for persistent storage
- 2024-12: Added favorites and playlists features
- 2024-12: Added genre selection (Lo-Fi, Jazz, Classical, Electronic, etc.)
- 2024-12: Initial implementation of Weather-Based Work BGM app

## Notes
- OpenAI is accessed via Replit AI Integrations (no API key needed, billed to credits)
- Weather data from Open-Meteo is free and requires no API key
- ElevenLabs Music API requires a paid plan ($5+/month) for audio generation
- Audio files are saved to `public/audio/` and served statically
