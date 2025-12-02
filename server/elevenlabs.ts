import { ElevenLabsClient } from "@elevenlabs/elevenlabs-js";
import * as fs from "fs";
import * as path from "path";

let elevenlabsClient: ElevenLabsClient | null = null;

function getElevenLabsClient(): ElevenLabsClient | null {
  if (!process.env.ELEVENLABS_API_KEY) {
    return null;
  }
  
  if (!elevenlabsClient) {
    elevenlabsClient = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY,
    });
  }
  
  return elevenlabsClient;
}

interface MusicGenerationParams {
  title: string;
  description: string;
  mood: string;
  genre: string;
  tempo: "slow" | "moderate" | "upbeat";
  durationMs?: number;
}

const tempoToBPM: Record<string, string> = {
  slow: "60-80 BPM, slow and relaxed",
  moderate: "90-110 BPM, steady pace",
  upbeat: "120-140 BPM, energetic",
};

export async function generateMusic(params: MusicGenerationParams): Promise<string | null> {
  const client = getElevenLabsClient();
  if (!client) {
    console.error("ElevenLabs API key not configured");
    return null;
  }

  const { title, description, mood, genre, tempo, durationMs = 30000 } = params;

  const prompt = `${genre} music. ${mood}. ${description}. ${tempoToBPM[tempo]}. Instrumental, perfect for focus and concentration. No vocals.`;

  try {
    console.log("Generating music with ElevenLabs...");
    console.log("Prompt:", prompt);

    const audioStream = await client.music.compose({
      prompt,
      musicLengthMs: durationMs,
    });

    const audioDir = path.join(process.cwd(), "public", "audio");
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const fileName = `bgm_${Date.now()}.mp3`;
    const filePath = path.join(audioDir, fileName);

    const reader = audioStream.getReader();
    const chunks: Uint8Array[] = [];
    
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) chunks.push(value);
    }
    
    const audioBuffer = Buffer.concat(chunks);
    fs.writeFileSync(filePath, audioBuffer);

    console.log("Music generated successfully:", fileName);
    return `/audio/${fileName}`;
  } catch (error: any) {
    console.error("Error generating music with ElevenLabs:", error);
    
    if (error.body?.detail?.status === "bad_prompt") {
      const suggestion = error.body.detail.data?.prompt_suggestion;
      console.error("Bad prompt detected. Suggestion:", suggestion);
    }
    
    return null;
  }
}

export function isElevenLabsConfigured(): boolean {
  return !!process.env.ELEVENLABS_API_KEY;
}
