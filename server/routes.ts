import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { getWeatherByCoordinates, getWeatherByCity } from "./weather";
import { generateBGMDescription } from "./openai";
import { generateBgmRequestSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
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
      const bgm = await storage.getBgm(req.params.id);
      
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
      const deleted = await storage.deleteBgm(req.params.id);
      
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

  return httpServer;
}
