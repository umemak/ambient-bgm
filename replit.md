# Ambient BGM - Weather-Based Work Music App

## Overview
A web application that generates work-suitable BGM (background music) based on the current weather and time of day. The app uses AI to create unique ambient music descriptions that match the user's environment, promoting focus and productivity.

## Key Features
- **Location Detection**: Auto-detect via browser GPS or manual city input
- **Weather Integration**: Real-time weather data from Open-Meteo API (free, no key required)
- **AI BGM Generation**: Uses OpenAI to generate creative BGM descriptions based on weather + time
- **Atmospheric UI**: Weather-responsive backgrounds with rain, snow, stars effects
- **BGM History**: Stores generated tracks in localStorage for playback
- **Theme Support**: Light, dark, and system theme options
- **Glass Morphism Design**: Modern frosted-glass UI components

## Tech Stack
- **Frontend**: React 18 + TypeScript, Tailwind CSS, Shadcn UI, Wouter routing
- **Backend**: Express.js, OpenAI API (via Replit AI Integrations)
- **Data**: In-memory storage, localStorage for persistence
- **APIs**: Open-Meteo (weather), OpenAI GPT-5 (BGM generation)

## Project Structure
```
client/
├── src/
│   ├── components/     # UI components
│   │   ├── weather-background.tsx  # Animated weather effects
│   │   ├── player-card.tsx         # Main player UI
│   │   ├── player-controls.tsx     # Playback controls
│   │   ├── bgm-info.tsx           # BGM display
│   │   ├── weather-display.tsx    # Weather info
│   │   ├── location-settings.tsx  # Location config
│   │   ├── bgm-history.tsx        # History panel
│   │   └── theme-toggle.tsx       # Theme switcher
│   ├── hooks/          # Custom React hooks
│   ├── lib/            # Utilities
│   └── pages/          # Page components
server/
├── routes.ts          # API endpoints
├── weather.ts         # Open-Meteo integration
├── openai.ts          # BGM generation
└── storage.ts         # In-memory storage
shared/
└── schema.ts          # TypeScript types & Zod schemas
```

## API Endpoints
- `GET /api/weather?lat=&lon=` - Get weather by coordinates
- `GET /api/weather?city=` - Get weather by city name
- `POST /api/bgm/generate` - Generate new BGM description
- `GET /api/bgm` - List all generated BGMs
- `DELETE /api/bgm/:id` - Delete a BGM

## Running the App
The workflow `Start application` runs `npm run dev` which starts both:
- Express backend on port 5000
- Vite development server for frontend

## Recent Changes
- 2024-12: Initial implementation of Weather-Based Work BGM app
  - Full MVP with location detection, weather API, AI generation
  - Glass morphism UI with weather-responsive backgrounds
  - BGM history and theme support

## Notes
- OpenAI is accessed via Replit AI Integrations (no API key needed, billed to credits)
- Weather data from Open-Meteo is free and requires no API key
- BGM history is stored in browser localStorage
