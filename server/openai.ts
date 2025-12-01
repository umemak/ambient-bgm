import OpenAI from "openai";
import type { WeatherData, TimeOfDay, InsertBGM } from "@shared/schema";

// This is using Replit's AI Integrations service, which provides OpenAI-compatible API access
// without requiring your own OpenAI API key.
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
});

interface BGMGenerationResult {
  title: string;
  description: string;
  mood: string;
  genre: string;
  tempo: "slow" | "moderate" | "upbeat";
}

export async function generateBGMDescription(
  weather: WeatherData,
  timeOfDay: TimeOfDay
): Promise<InsertBGM> {
  const prompt = `You are a music curator specializing in ambient and focus music. Based on the current weather and time of day, suggest a perfect work BGM (background music) for concentration and productivity.

Current conditions:
- Weather: ${weather.condition} (${weather.description})
- Temperature: ${weather.temperature}°C
- Time of Day: ${timeOfDay}
- Location: ${weather.location}

Generate a unique, creative BGM suggestion that matches this atmosphere. The music should help with focus and work.

You MUST respond with a valid JSON object in this exact format (no additional text, just JSON):
{
  "title": "A creative, evocative title for the BGM (e.g., 'Rainy Day Focus', 'Sunrise Productivity')",
  "description": "A 2-3 sentence description of the music's feel, instruments, and atmosphere",
  "mood": "A short mood phrase (e.g., 'Calm & Focused', 'Energetic Morning', 'Cozy & Reflective')",
  "genre": "The music genre (e.g., 'Lo-Fi Hip Hop', 'Ambient Electronic', 'Jazz Piano', 'Classical Focus', 'Chill Wave')",
  "tempo": "slow OR moderate OR upbeat"
}`;

  try {
    const response = await openai.chat.completions.create({
      // the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
      model: "gpt-5",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      max_completion_tokens: 500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      console.error("No response content from OpenAI");
      return generateFallbackBGM(weather, timeOfDay);
    }

    let result: BGMGenerationResult;
    try {
      result = JSON.parse(content);
    } catch (parseError) {
      console.error("Failed to parse OpenAI response:", content);
      return generateFallbackBGM(weather, timeOfDay);
    }

    // Validate and sanitize the response
    const validTempos = ["slow", "moderate", "upbeat"] as const;
    const tempo = validTempos.includes(result.tempo as any) ? result.tempo : "moderate";

    // Ensure all required fields are present
    const title = typeof result.title === "string" && result.title.trim() 
      ? result.title.trim() 
      : "Ambient Focus";
    const description = typeof result.description === "string" && result.description.trim()
      ? result.description.trim()
      : "A calming ambient track for concentration.";
    const mood = typeof result.mood === "string" && result.mood.trim()
      ? result.mood.trim()
      : "Calm & Focused";
    const genre = typeof result.genre === "string" && result.genre.trim()
      ? result.genre.trim()
      : "Ambient";

    return {
      title,
      description,
      mood,
      genre,
      tempo,
      weatherCondition: weather.condition,
      timeOfDay: timeOfDay,
    };
  } catch (error) {
    console.error("Error generating BGM description:", error);
    // Fallback to a default BGM based on conditions
    return generateFallbackBGM(weather, timeOfDay);
  }
}

function generateFallbackBGM(weather: WeatherData, timeOfDay: TimeOfDay): InsertBGM {
  const moods: Record<string, { mood: string; genre: string; tempo: "slow" | "moderate" | "upbeat" }> = {
    "sunny-morning": { mood: "Bright & Energetic", genre: "Uplifting Electronic", tempo: "upbeat" },
    "sunny-afternoon": { mood: "Focused & Productive", genre: "Ambient House", tempo: "moderate" },
    "sunny-evening": { mood: "Warm & Relaxing", genre: "Sunset Chill", tempo: "slow" },
    "sunny-night": { mood: "Peaceful & Calm", genre: "Night Ambient", tempo: "slow" },
    "clear-morning": { mood: "Fresh & Motivated", genre: "Acoustic Focus", tempo: "moderate" },
    "clear-afternoon": { mood: "Clear-headed & Productive", genre: "Minimal Electronic", tempo: "moderate" },
    "clear-evening": { mood: "Serene & Reflective", genre: "Piano Ambient", tempo: "slow" },
    "clear-night": { mood: "Tranquil & Starlit", genre: "Space Ambient", tempo: "slow" },
    "cloudy-morning": { mood: "Thoughtful & Focused", genre: "Indie Focus", tempo: "moderate" },
    "cloudy-afternoon": { mood: "Deep Work Mode", genre: "Minimal Electronic", tempo: "moderate" },
    "cloudy-evening": { mood: "Contemplative", genre: "Post-Rock Ambient", tempo: "slow" },
    "cloudy-night": { mood: "Introspective", genre: "Dark Ambient", tempo: "slow" },
    "rainy-morning": { mood: "Cozy & Focused", genre: "Lo-Fi Rain", tempo: "slow" },
    "rainy-afternoon": { mood: "Creative Flow", genre: "Jazz Piano", tempo: "moderate" },
    "rainy-evening": { mood: "Reflective", genre: "Acoustic Ambient", tempo: "slow" },
    "rainy-night": { mood: "Dreamy & Calm", genre: "Ethereal Wave", tempo: "slow" },
    "snowy-morning": { mood: "Crisp & Quiet", genre: "Winter Ambient", tempo: "slow" },
    "snowy-afternoon": { mood: "Peaceful & Soft", genre: "Nordic Folk", tempo: "slow" },
    "snowy-evening": { mood: "Warm Inside", genre: "Cozy Acoustic", tempo: "slow" },
    "snowy-night": { mood: "Silent & Magical", genre: "Ambient Soundscape", tempo: "slow" },
    "stormy-morning": { mood: "Intense Focus", genre: "Cinematic Ambient", tempo: "moderate" },
    "stormy-afternoon": { mood: "Dramatic & Powerful", genre: "Epic Ambient", tempo: "moderate" },
    "stormy-evening": { mood: "Mysterious", genre: "Dark Electronic", tempo: "moderate" },
    "stormy-night": { mood: "Atmospheric", genre: "Thunder Ambient", tempo: "slow" },
    "foggy-morning": { mood: "Ethereal & Quiet", genre: "Misty Ambient", tempo: "slow" },
    "foggy-afternoon": { mood: "Mysterious & Calm", genre: "Drone Ambient", tempo: "slow" },
    "foggy-evening": { mood: "Hazy & Dreamy", genre: "Shoegaze Ambient", tempo: "slow" },
    "foggy-night": { mood: "Ghostly & Serene", genre: "Dark Ambient", tempo: "slow" },
    "windy-morning": { mood: "Fresh & Dynamic", genre: "Acoustic Folk", tempo: "moderate" },
    "windy-afternoon": { mood: "Free & Flowing", genre: "World Ambient", tempo: "moderate" },
    "windy-evening": { mood: "Wild & Free", genre: "Cinematic Strings", tempo: "moderate" },
    "windy-night": { mood: "Restless & Deep", genre: "Electronic Ambient", tempo: "slow" },
  };

  const key = `${weather.condition}-${timeOfDay}`;
  const moodData = moods[key] || { mood: "Calm & Focused", genre: "Ambient", tempo: "moderate" as const };

  const conditionLabel = weather.condition.charAt(0).toUpperCase() + weather.condition.slice(1);
  const timeLabel = timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);

  return {
    title: `${conditionLabel} ${timeLabel} Vibes`,
    description: `Perfect ambient music for a ${weather.condition} ${timeOfDay}. Let the sounds help you focus and stay productive.`,
    mood: moodData.mood,
    genre: moodData.genre,
    tempo: moodData.tempo,
    weatherCondition: weather.condition,
    timeOfDay: timeOfDay,
  };
}
