import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth } from "./auth";
import { z } from "zod";
import { insertConnectionSchema, insertFeedSchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);

  // Get all connections for the current user
  app.get("/api/connections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const connections = await storage.getConnectionsByUserId(req.user.id);
    res.json(connections);
  });

  // Create a new connection
  app.post("/api/connections", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      const connectionData = insertConnectionSchema.parse({
        ...req.body,
        user_id: req.user.id,
      });
      
      const connection = await storage.createConnection(connectionData);
      res.status(201).json(connection);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  });

  // Get a connection by ID
  app.get("/api/connections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const connectionId = parseInt(req.params.id);
    const connection = await storage.getConnection(connectionId);
    
    if (!connection || connection.user_id !== req.user.id) {
      return res.status(404).json({ message: "Connection not found" });
    }
    
    res.json(connection);
  });

  // Update a connection
  app.patch("/api/connections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const connectionId = parseInt(req.params.id);
    const existingConnection = await storage.getConnection(connectionId);
    
    if (!existingConnection || existingConnection.user_id !== req.user.id) {
      return res.status(404).json({ message: "Connection not found" });
    }
    
    const connection = await storage.updateConnection(connectionId, req.body);
    res.json(connection);
  });

  // Delete a connection
  app.delete("/api/connections/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const connectionId = parseInt(req.params.id);
    const existingConnection = await storage.getConnection(connectionId);
    
    if (!existingConnection || existingConnection.user_id !== req.user.id) {
      return res.status(404).json({ message: "Connection not found" });
    }
    
    await storage.deleteConnection(connectionId);
    res.sendStatus(204);
  });

  // Get all feeds for the current user
  app.get("/api/feeds", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const feeds = await storage.getFeedsByUserId(req.user.id);
    res.json(feeds);
  });

  // Create a new feed
  app.post("/api/feeds", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    try {
      // Process full_text into contents based on separator
      const { full_text, separator, ...restBody } = req.body;
      const contents = full_text.split(separator).map(item => item.trim()).filter(Boolean);
      
      const feedData = insertFeedSchema.parse({
        ...restBody,
        full_text,
        separator,
        contents,
        completed_contents: [],
        user_id: req.user.id,
      });
      
      const feed = await storage.createFeed(feedData);
      res.status(201).json(feed);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: error.message });
      }
      throw error;
    }
  });

  // Get a feed by ID
  app.get("/api/feeds/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const feedId = parseInt(req.params.id);
    const feed = await storage.getFeed(feedId);
    
    if (!feed || feed.user_id !== req.user.id) {
      return res.status(404).json({ message: "Feed not found" });
    }
    
    res.json(feed);
  });

  // Update a feed
  app.patch("/api/feeds/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const feedId = parseInt(req.params.id);
    const existingFeed = await storage.getFeed(feedId);
    
    if (!existingFeed || existingFeed.user_id !== req.user.id) {
      return res.status(404).json({ message: "Feed not found" });
    }
    
    // Handle updating full_text and contents if they're provided
    const updateData = { ...req.body };
    if (updateData.full_text && updateData.separator) {
      updateData.contents = updateData.full_text
        .split(updateData.separator)
        .map((item: string) => item.trim())
        .filter(Boolean);
    }
    
    const feed = await storage.updateFeed(feedId, updateData);
    res.json(feed);
  });

  // Toggle feed active status
  app.patch("/api/feeds/:id/toggle", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const feedId = parseInt(req.params.id);
    const existingFeed = await storage.getFeed(feedId);
    
    if (!existingFeed || existingFeed.user_id !== req.user.id) {
      return res.status(404).json({ message: "Feed not found" });
    }
    
    const feed = await storage.updateFeed(feedId, { active: !existingFeed.active });
    res.json(feed);
  });

  // Delete a feed
  app.delete("/api/feeds/:id", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const feedId = parseInt(req.params.id);
    const existingFeed = await storage.getFeed(feedId);
    
    if (!existingFeed || existingFeed.user_id !== req.user.id) {
      return res.status(404).json({ message: "Feed not found" });
    }
    
    await storage.deleteFeed(feedId);
    res.sendStatus(204);
  });
  
  // Get dashboard stats
  app.get("/api/stats", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const connections = await storage.getConnectionsByUserId(req.user.id);
    const feeds = await storage.getFeedsByUserId(req.user.id);
    const activeFeeds = feeds.filter(feed => feed.active).length;
    const contentDelivered = feeds.reduce((sum, feed) => sum + feed.num_sent, 0);
    
    res.json({
      activeFeeds,
      connectedApps: connections.length,
      contentDelivered,
    });
  });

  const httpServer = createServer(app);
  return httpServer;
}
