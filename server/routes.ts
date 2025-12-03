import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getWeatherByCoordinates, getWeatherByCity } from "./weather";
import { generateBGMDescription } from "./openai";
import { generateMusic, isElevenLabsConfigured } from "./elevenlabs";
import { generateBgmRequestSchema, insertPlaylistSchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth, isAuthenticated } from "./replitAuth";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  // Setup authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // Get weather data
  app.get("/api/weather", async (req, res) => {
    try {
      const { lat, lon, city } = req.query;

      if (city && typeof city === "string") {
        const weather = await getWeatherByCity(city);
        return res.json({ success: true, data: weather });
      }

      if (lat && lon) {
        const latitude = parseFloat(lat as string);
        const longitude = parseFloat(lon as string);

        if (isNaN(latitude) || isNaN(longitude)) {
          return res.status(400).json({
            success: false,
            error: "Invalid coordinates",
          });
        }

        const weather = await getWeatherByCoordinates(latitude, longitude);
        return res.json({ success: true, data: weather });
      }

      return res.status(400).json({
        success: false,
        error: "Please provide either coordinates (lat, lon) or city name",
      });
    } catch (error) {
      console.error("Weather API error:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch weather data",
      });
    }
  });

  // Generate new BGM based on weather and time
  app.post("/api/bgm/generate", async (req, res) => {
    try {
      const validatedData = generateBgmRequestSchema.parse(req.body);
      
      const bgmData = await generateBGMDescription(
        validatedData.weather,
        validatedData.timeOfDay,
        validatedData.preferredGenre ?? "auto"
      );
      
      const bgm = await storage.createBgm(bgmData);
      
      return res.json({ success: true, data: bgm });
    } catch (error) {
      console.error("BGM generation error:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid request data",
          details: error.errors,
        });
      }
      
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate BGM",
      });
    }
  });

  // Get all BGMs
  app.get("/api/bgm", async (req, res) => {
    try {
      const bgms = await storage.getAllBgms();
      return res.json({ success: true, data: bgms });
    } catch (error) {
      console.error("Error fetching BGMs:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch BGM list",
      });
    }
  });

  // Get single BGM
  app.get("/api/bgm/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid BGM ID",
        });
      }
      
      const bgm = await storage.getBgm(id);
      
      if (!bgm) {
        return res.status(404).json({
          success: false,
          error: "BGM not found",
        });
      }
      
      return res.json({ success: true, data: bgm });
    } catch (error) {
      console.error("Error fetching BGM:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch BGM",
      });
    }
  });

  // Delete BGM
  app.delete("/api/bgm/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid BGM ID",
        });
      }
      
      const deleted = await storage.deleteBgm(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "BGM not found",
        });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting BGM:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete BGM",
      });
    }
  });

  // Clear all BGMs
  app.delete("/api/bgm", async (req, res) => {
    try {
      await storage.clearBgms();
      return res.json({ success: true });
    } catch (error) {
      console.error("Error clearing BGMs:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to clear BGMs",
      });
    }
  });

  // Generate audio for a BGM
  app.post("/api/bgm/:id/audio", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid BGM ID",
        });
      }

      if (!isElevenLabsConfigured()) {
        return res.status(503).json({
          success: false,
          error: "Music generation service not configured. Please add ELEVENLABS_API_KEY.",
        });
      }

      const bgm = await storage.getBgm(id);
      if (!bgm) {
        return res.status(404).json({
          success: false,
          error: "BGM not found",
        });
      }

      const audioUrl = await generateMusic({
        title: bgm.title,
        description: bgm.description,
        mood: bgm.mood,
        genre: bgm.genre,
        tempo: bgm.tempo as "slow" | "moderate" | "upbeat",
        durationMs: 30000,
      });

      if (!audioUrl) {
        return res.status(500).json({
          success: false,
          error: "Failed to generate audio",
        });
      }

      const updatedBgm = await storage.updateBgmAudioUrl(id, audioUrl);
      
      return res.json({ success: true, data: updatedBgm });
    } catch (error) {
      console.error("Audio generation error:", error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Failed to generate audio",
      });
    }
  });

  // Check if music generation is available
  app.get("/api/music/status", async (req, res) => {
    return res.json({
      success: true,
      data: {
        configured: isElevenLabsConfigured(),
      },
    });
  });

  // Toggle favorite status
  app.post("/api/bgm/:id/favorite", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid BGM ID",
        });
      }
      
      const bgm = await storage.toggleFavorite(id);
      
      if (!bgm) {
        return res.status(404).json({
          success: false,
          error: "BGM not found",
        });
      }
      
      return res.json({ success: true, data: bgm });
    } catch (error) {
      console.error("Error toggling favorite:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to toggle favorite",
      });
    }
  });

  // Get all favorites
  app.get("/api/favorites", async (req, res) => {
    try {
      const favorites = await storage.getFavorites();
      return res.json({ success: true, data: favorites });
    } catch (error) {
      console.error("Error fetching favorites:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch favorites",
      });
    }
  });

  // Playlist routes
  app.get("/api/playlists", async (req, res) => {
    try {
      const playlists = await storage.getAllPlaylists();
      return res.json({ success: true, data: playlists });
    } catch (error) {
      console.error("Error fetching playlists:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch playlists",
      });
    }
  });

  app.post("/api/playlists", async (req, res) => {
    try {
      const validatedData = insertPlaylistSchema.parse(req.body);
      const playlist = await storage.createPlaylist(validatedData);
      return res.json({ success: true, data: playlist });
    } catch (error) {
      console.error("Error creating playlist:", error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: "Invalid playlist data",
          details: error.errors,
        });
      }
      
      return res.status(500).json({
        success: false,
        error: "Failed to create playlist",
      });
    }
  });

  app.get("/api/playlists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid playlist ID",
        });
      }
      
      const playlist = await storage.getPlaylist(id);
      
      if (!playlist) {
        return res.status(404).json({
          success: false,
          error: "Playlist not found",
        });
      }
      
      return res.json({ success: true, data: playlist });
    } catch (error) {
      console.error("Error fetching playlist:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch playlist",
      });
    }
  });

  app.delete("/api/playlists/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid playlist ID",
        });
      }
      
      const deleted = await storage.deletePlaylist(id);
      
      if (!deleted) {
        return res.status(404).json({
          success: false,
          error: "Playlist not found",
        });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting playlist:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to delete playlist",
      });
    }
  });

  app.get("/api/playlists/:id/items", async (req, res) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          error: "Invalid playlist ID",
        });
      }
      
      const items = await storage.getPlaylistItems(id);
      return res.json({ success: true, data: items });
    } catch (error) {
      console.error("Error fetching playlist items:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to fetch playlist items",
      });
    }
  });

  app.post("/api/playlists/:playlistId/items/:bgmId", async (req, res) => {
    try {
      const playlistId = parseInt(req.params.playlistId, 10);
      const bgmId = parseInt(req.params.bgmId, 10);
      
      if (isNaN(playlistId) || isNaN(bgmId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid ID",
        });
      }
      
      const item = await storage.addToPlaylist(playlistId, bgmId);
      return res.json({ success: true, data: item });
    } catch (error) {
      console.error("Error adding to playlist:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to add to playlist",
      });
    }
  });

  app.delete("/api/playlists/:playlistId/items/:bgmId", async (req, res) => {
    try {
      const playlistId = parseInt(req.params.playlistId, 10);
      const bgmId = parseInt(req.params.bgmId, 10);
      
      if (isNaN(playlistId) || isNaN(bgmId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid ID",
        });
      }
      
      const removed = await storage.removeFromPlaylist(playlistId, bgmId);
      
      if (!removed) {
        return res.status(404).json({
          success: false,
          error: "Item not found in playlist",
        });
      }
      
      return res.json({ success: true });
    } catch (error) {
      console.error("Error removing from playlist:", error);
      return res.status(500).json({
        success: false,
        error: "Failed to remove from playlist",
      });
    }
  });

  return httpServer;
}
