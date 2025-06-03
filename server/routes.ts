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

  // Facebook Accounts API
  app.get("/api/facebook/accounts", async (req, res) => {
    try {
      const accounts = await storage.getFacebookAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching Facebook accounts:", error);
      res.status(500).json({ message: "Failed to fetch Facebook accounts" });
    }
  });

  app.post("/api/facebook/accounts", async (req, res) => {
    try {
      const account = await storage.createFacebookAccount(req.body);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating Facebook account:", error);
      res.status(500).json({ message: "Failed to create Facebook account" });
    }
  });

  app.patch("/api/facebook/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const account = await storage.updateFacebookAccount(id, req.body);
      if (!account) {
        return res.status(404).json({ message: "Facebook account not found" });
      }
      res.json(account);
    } catch (error) {
      console.error("Error updating Facebook account:", error);
      res.status(500).json({ message: "Failed to update Facebook account" });
    }
  });

  app.delete("/api/facebook/accounts/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFacebookAccount(id);
      if (!success) {
        return res.status(404).json({ message: "Facebook account not found" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting Facebook account:", error);
      res.status(500).json({ message: "Failed to delete Facebook account" });
    }
  });

  // Facebook Account Generation Tasks API
  app.get("/api/facebook/generation-tasks", async (req, res) => {
    try {
      const tasks = [
        {
          id: 1,
          taskName: "北金國際營銷帳號批次",
          targetCount: 50,
          completedCount: 35,
          failedCount: 3,
          progress: 76,
          status: "running",
          createdAt: "2024-06-03T09:00:00",
        },
        {
          id: 2,
          taskName: "企業推廣帳號",
          targetCount: 30,
          completedCount: 30,
          failedCount: 0,
          progress: 100,
          status: "completed",
          createdAt: "2024-06-02T14:30:00",
        },
      ];
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching generation tasks:", error);
      res.status(500).json({ message: "Failed to fetch generation tasks" });
    }
  });

  app.post("/api/facebook/generation-tasks", async (req, res) => {
    try {
      const taskData = req.body;
      
      const newTask = {
        id: Date.now(),
        taskName: taskData.taskName,
        targetCount: taskData.targetCount,
        completedCount: 0,
        failedCount: 0,
        progress: 0,
        status: "pending",
        createdAt: new Date().toISOString(),
        settings: taskData,
      };
      
      // Start the account creation process
      setTimeout(() => {
        console.log(`Starting account creation task ${newTask.id} for ${taskData.targetCount} accounts`);
      }, 1000);
      
      res.status(201).json(newTask);
    } catch (error) {
      console.error("Error creating generation task:", error);
      res.status(500).json({ message: "Failed to create generation task" });
    }
  });

  // Facebook Data Collection API
  app.post("/api/facebook/collect-data", async (req, res) => {
    try {
      const { accountId, dataType, targetUrl, filters } = req.body;
      
      const collectionTask = {
        id: Date.now(),
        accountId,
        dataType,
        targetUrl,
        filters,
        status: "running",
        progress: 0,
        startedAt: new Date().toISOString(),
      };
      
      res.status(201).json({ 
        success: true, 
        taskId: collectionTask.id,
        message: "Data collection started successfully" 
      });
    } catch (error) {
      console.error("Error starting data collection:", error);
      res.status(500).json({ message: "Failed to start data collection" });
    }
  });

  // Facebook Batch Management API
  app.get("/api/facebook/batch-accounts", async (req, res) => {
    try {
      const batches = [
        {
          id: 1,
          batchName: "營銷帳號批次A",
          totalAccounts: 15,
          activeAccounts: 12,
          pendingAccounts: 3,
          failedAccounts: 0,
          createdDate: "2024-06-01",
          status: "running",
          progress: 80,
        },
        {
          id: 2,
          batchName: "企業客戶養號",
          totalAccounts: 10,
          activeAccounts: 8,
          pendingAccounts: 1,
          failedAccounts: 1,
          createdDate: "2024-05-28",
          status: "completed",
          progress: 100,
        },
      ];
      res.json(batches);
    } catch (error) {
      console.error("Error fetching batch accounts:", error);
      res.status(500).json({ message: "Failed to fetch batch accounts" });
    }
  });

  app.post("/api/facebook/batch-accounts", async (req, res) => {
    try {
      const batchData = req.body;
      
      const newBatch = {
        id: Date.now(),
        batchName: batchData.batchName,
        totalAccounts: batchData.accountCount,
        activeAccounts: 0,
        pendingAccounts: batchData.accountCount,
        failedAccounts: 0,
        createdDate: new Date().toISOString().split('T')[0],
        status: "creating",
        progress: 0,
        settings: batchData,
      };
      
      res.status(201).json(newBatch);
    } catch (error) {
      console.error("Error creating batch accounts:", error);
      res.status(500).json({ message: "Failed to create batch accounts" });
    }
  });

  // Message Templates API
  app.get("/api/facebook/message-templates", async (req, res) => {
    try {
      const templates = await storage.getMessageTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching message templates:", error);
      res.status(500).json({ message: "Failed to fetch message templates" });
    }
  });

  app.post("/api/facebook/message-templates", async (req, res) => {
    try {
      const template = await storage.createMessageTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating message template:", error);
      res.status(500).json({ message: "Failed to create message template" });
    }
  });

  // Auto Reply Rules API
  app.get("/api/facebook/auto-reply-rules", async (req, res) => {
    try {
      const { accountId } = req.query;
      const rules = await storage.getAutoReplyRules(
        accountId ? parseInt(accountId as string) : undefined
      );
      res.json(rules);
    } catch (error) {
      console.error("Error fetching auto reply rules:", error);
      res.status(500).json({ message: "Failed to fetch auto reply rules" });
    }
  });

  app.post("/api/facebook/auto-reply-rules", async (req, res) => {
    try {
      const rule = await storage.createAutoReplyRule(req.body);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating auto reply rule:", error);
      res.status(500).json({ message: "Failed to create auto reply rule" });
    }
  });

  // Translation API
  app.get("/api/translations", async (req, res) => {
    try {
      const { limit } = req.query;
      const translations = await storage.getTranslations(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(translations);
    } catch (error) {
      console.error("Error fetching translations:", error);
      res.status(500).json({ message: "Failed to fetch translations" });
    }
  });

  app.post("/api/translations", async (req, res) => {
    try {
      const { originalText, targetLanguage } = req.body;
      
      // Check if translation already exists
      const existing = await storage.getTranslationByText(originalText, targetLanguage);
      if (existing) {
        return res.json(existing);
      }
      
      // Simulate translation (in production, would use Google Translate API or similar)
      const translatedText = `[${targetLanguage.toUpperCase()}] ${originalText}`;
      
      const translation = await storage.createTranslation({
        originalText,
        translatedText,
        sourceLanguage: 'auto',
        targetLanguage,
        service: 'internal',
      });
      
      res.status(201).json(translation);
    } catch (error) {
      console.error("Error creating translation:", error);
      res.status(500).json({ message: "Failed to create translation" });
    }
  });

  // Facebook Friends API
  app.get("/api/facebook/friends", async (req, res) => {
    try {
      const { accountId, search } = req.query;
      const friends = await storage.getFacebookFriends(
        accountId ? parseInt(accountId as string) : undefined,
        search as string
      );
      res.json(friends);
    } catch (error) {
      console.error("Error fetching Facebook friends:", error);
      res.status(500).json({ message: "Failed to fetch Facebook friends" });
    }
  });

  app.post("/api/facebook/friends", async (req, res) => {
    try {
      const friend = await storage.createFacebookFriend(req.body);
      res.status(201).json(friend);
    } catch (error) {
      console.error("Error creating Facebook friend:", error);
      res.status(500).json({ message: "Failed to create Facebook friend" });
    }
  });

  app.get("/api/facebook/friends/search", async (req, res) => {
    try {
      const { keyword, location, school } = req.query;
      if (!keyword) {
        return res.status(400).json({ message: "Keyword is required" });
      }
      const friends = await storage.searchFriendsByKeyword(
        keyword as string,
        location as string,
        school as string
      );
      res.json(friends);
    } catch (error) {
      console.error("Error searching friends:", error);
      res.status(500).json({ message: "Failed to search friends" });
    }
  });

  // Friend Groups API
  app.get("/api/facebook/groups", async (req, res) => {
    try {
      const { accountId } = req.query;
      const groups = await storage.getFriendGroups(
        accountId ? parseInt(accountId as string) : undefined
      );
      res.json(groups);
    } catch (error) {
      console.error("Error fetching friend groups:", error);
      res.status(500).json({ message: "Failed to fetch friend groups" });
    }
  });

  app.post("/api/facebook/groups", async (req, res) => {
    try {
      const group = await storage.createFriendGroup(req.body);
      res.status(201).json(group);
    } catch (error) {
      console.error("Error creating friend group:", error);
      res.status(500).json({ message: "Failed to create friend group" });
    }
  });

  app.get("/api/facebook/groups/:id/members", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const members = await storage.getFriendGroupMembers(id);
      res.json(members);
    } catch (error) {
      console.error("Error fetching group members:", error);
      res.status(500).json({ message: "Failed to fetch group members" });
    }
  });

  app.post("/api/facebook/groups/:groupId/members/:friendId", async (req, res) => {
    try {
      const groupId = parseInt(req.params.groupId);
      const friendId = parseInt(req.params.friendId);
      const success = await storage.addFriendToGroup(groupId, friendId);
      if (!success) {
        return res.status(400).json({ message: "Failed to add friend to group" });
      }
      res.status(204).send();
    } catch (error) {
      console.error("Error adding friend to group:", error);
      res.status(500).json({ message: "Failed to add friend to group" });
    }
  });

  // Message Templates API
  app.get("/api/facebook/templates", async (req, res) => {
    try {
      const templates = await storage.getMessageTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching message templates:", error);
      res.status(500).json({ message: "Failed to fetch message templates" });
    }
  });

  app.post("/api/facebook/templates", async (req, res) => {
    try {
      const template = await storage.createMessageTemplate(req.body);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating message template:", error);
      res.status(500).json({ message: "Failed to create message template" });
    }
  });

  // Group Messages API
  app.get("/api/facebook/messages", async (req, res) => {
    try {
      const { accountId, groupId } = req.query;
      const messages = await storage.getGroupMessages(
        accountId ? parseInt(accountId as string) : undefined,
        groupId ? parseInt(groupId as string) : undefined
      );
      res.json(messages);
    } catch (error) {
      console.error("Error fetching group messages:", error);
      res.status(500).json({ message: "Failed to fetch group messages" });
    }
  });

  app.post("/api/facebook/messages", async (req, res) => {
    try {
      const message = await storage.createGroupMessage(req.body);
      res.status(201).json(message);
    } catch (error) {
      console.error("Error creating group message:", error);
      res.status(500).json({ message: "Failed to create group message" });
    }
  });

  // Auto Reply Rules API
  app.get("/api/facebook/auto-reply", async (req, res) => {
    try {
      const { accountId } = req.query;
      const rules = await storage.getAutoReplyRules(
        accountId ? parseInt(accountId as string) : undefined
      );
      res.json(rules);
    } catch (error) {
      console.error("Error fetching auto reply rules:", error);
      res.status(500).json({ message: "Failed to fetch auto reply rules" });
    }
  });

  app.post("/api/facebook/auto-reply", async (req, res) => {
    try {
      const rule = await storage.createAutoReplyRule(req.body);
      res.status(201).json(rule);
    } catch (error) {
      console.error("Error creating auto reply rule:", error);
      res.status(500).json({ message: "Failed to create auto reply rule" });
    }
  });

  // Translation API
  app.get("/api/translations", async (req, res) => {
    try {
      const { limit } = req.query;
      const translations = await storage.getTranslations(
        limit ? parseInt(limit as string) : undefined
      );
      res.json(translations);
    } catch (error) {
      console.error("Error fetching translations:", error);
      res.status(500).json({ message: "Failed to fetch translations" });
    }
  });

  app.post("/api/translate", async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ message: "Text and target language are required" });
      }

      // Check if translation already exists
      const existing = await storage.getTranslationByText(text, targetLanguage);
      if (existing) {
        return res.json(existing);
      }

      // Real translation would require external service API key
      // For now, return error to prompt user for API configuration
      return res.status(503).json({ 
        message: "Translation service not configured. Please provide translation API credentials.",
        requiresSetup: true 
      });
    } catch (error) {
      console.error("Error translating text:", error);
      res.status(500).json({ message: "Failed to translate text" });
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

    const newProgress = Math.min((task.progress ?? 0) + Math.floor(Math.random() * 10) + 1, 100);
    
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
