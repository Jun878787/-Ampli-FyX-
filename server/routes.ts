import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertCollectionTaskSchema, insertCollectedDataSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // System Stats routes
  app.get("/api/stats", async (req, res) => {
    try {
      const stats = await storage.getSystemStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch system stats" });
    }
  });

  // Collection Tasks routes
  app.get("/api/tasks", async (req, res) => {
    try {
      const tasks = await storage.getCollectionTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collection tasks" });
    }
  });

  app.post("/api/tasks", async (req, res) => {
    try {
      const taskData = insertCollectionTaskSchema.parse(req.body);
      const task = await storage.createCollectionTask(taskData);
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create collection task" });
      }
    }
  });

  app.put("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const task = await storage.updateCollectionTask(id, updates);
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to update collection task" });
    }
  });

  app.delete("/api/tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCollectionTask(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete collection task" });
    }
  });

  // Start collection task
  app.post("/api/tasks/:id/start", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateCollectionTask(id, { 
        status: "running", 
        progress: 0 
      });
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }

      // Simulate collection progress
      simulateCollectionProgress(id);
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to start collection task" });
    }
  });

  // Stop collection task
  app.post("/api/tasks/:id/stop", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.updateCollectionTask(id, { 
        status: "pending" 
      });
      
      if (!task) {
        return res.status(404).json({ error: "Task not found" });
      }
      
      res.json(task);
    } catch (error) {
      res.status(500).json({ error: "Failed to stop collection task" });
    }
  });

  // Collected Data routes
  app.get("/api/data", async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = parseInt(req.query.offset as string) || 0;
      const search = req.query.search as string;
      
      const result = await storage.getCollectedData(limit, offset, search);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch collected data" });
    }
  });

  app.post("/api/data", async (req, res) => {
    try {
      const dataItem = insertCollectedDataSchema.parse(req.body);
      const created = await storage.createCollectedData(dataItem);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid data", details: error.errors });
      } else {
        res.status(500).json({ error: "Failed to create collected data" });
      }
    }
  });

  app.delete("/api/data/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteCollectedData(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Data not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete collected data" });
    }
  });

  // Export data route
  app.post("/api/export", async (req, res) => {
    try {
      const { ids, format = 'csv' } = req.body;
      
      // Simulate export process
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      res.json({ 
        success: true, 
        message: `Successfully exported ${ids?.length || 'all'} items in ${format} format`,
        downloadUrl: `/api/download/${Date.now()}.${format}`
      });
    } catch (error) {
      res.status(500).json({ error: "Failed to export data" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

// Simulate collection progress for demo purposes
function simulateCollectionProgress(taskId: number) {
  const interval = setInterval(async () => {
    const task = await storage.getCollectionTask(taskId);
    if (!task || task.status !== "running") {
      clearInterval(interval);
      return;
    }

    const newProgress = Math.min(task.progress + Math.floor(Math.random() * 10) + 1, 100);
    
    if (newProgress >= 100) {
      await storage.updateCollectionTask(taskId, {
        progress: 100,
        status: "completed",
        completedAt: new Date(),
      });
      clearInterval(interval);
    } else {
      await storage.updateCollectionTask(taskId, { progress: newProgress });
    }

    // Generate some mock collected data during progress
    if (Math.random() > 0.7) {
      const mockPosts = [
        "分享今天的美好時光！",
        "學習新技術總是讓人興奮",
        "和朋友聚餐，享受美食",
        "工作中的小確幸",
        "週末放鬆的好方法",
      ];
      
      const mockAuthors = [
        { name: "David Lee", followers: "9.1K", avatar: "D" },
        { name: "Emma Wu", followers: "23.4K", avatar: "E" },
        { name: "Frank Chen", followers: "5.7K", avatar: "F" },
      ];

      const randomPost = mockPosts[Math.floor(Math.random() * mockPosts.length)];
      const randomAuthor = mockAuthors[Math.floor(Math.random() * mockAuthors.length)];

      await storage.createCollectedData({
        taskId,
        type: "post",
        content: randomPost,
        author: randomAuthor,
        publishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
        interactions: {
          likes: Math.floor(Math.random() * 200),
          comments: Math.floor(Math.random() * 50),
          shares: Math.floor(Math.random() * 20),
        },
        status: "collected",
        metadata: {},
      });
    }
  }, 3000);
}
