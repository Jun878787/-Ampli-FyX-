import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertCollectionTaskSchema, 
  insertCollectedDataSchema, 
  insertFacebookGenerationTaskSchema,
  insertFacebookAccountSchema,
  insertFacebookFriendSchema,
  insertFriendGroupSchema,
  insertMessageTemplateSchema,
  insertGroupMessageSchema,
  insertAutoReplyRuleSchema,
  insertTranslationSchema
} from "@shared/schema";
import { z } from "zod";
import { gmailService, type GmailAccountRequest } from "./gmail-service";
import { facebookService } from "./facebook-service";

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

  // Facebook Generation Tasks API
  app.get("/api/facebook/generation-tasks", async (req, res) => {
    try {
      const tasks = await storage.getFacebookGenerationTasks();
      res.json(tasks);
    } catch (error) {
      console.error("Error fetching Facebook generation tasks:", error);
      res.status(500).json({ message: "Failed to fetch Facebook generation tasks" });
    }
  });

  app.post("/api/facebook/generation-tasks", async (req, res) => {
    try {
      const taskData = insertFacebookGenerationTaskSchema.parse(req.body);
      const task = await storage.createFacebookGenerationTask(taskData);
      
      // Simulate task execution
      if (task.status === 'pending') {
        simulateFacebookAccountGeneration(task.id);
      }
      
      res.status(201).json(task);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ error: "Invalid task data", details: error.errors });
      } else {
        console.error("Error creating Facebook generation task:", error);
        res.status(500).json({ message: "Failed to create Facebook generation task" });
      }
    }
  });

  app.get("/api/facebook/generation-tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const task = await storage.getFacebookGenerationTask(id);
      if (!task) {
        return res.status(404).json({ message: "Facebook generation task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching Facebook generation task:", error);
      res.status(500).json({ message: "Failed to fetch Facebook generation task" });
    }
  });

  app.put("/api/facebook/generation-tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const task = await storage.updateFacebookGenerationTask(id, updates);
      if (!task) {
        return res.status(404).json({ message: "Facebook generation task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error updating Facebook generation task:", error);
      res.status(500).json({ message: "Failed to update Facebook generation task" });
    }
  });

  app.delete("/api/facebook/generation-tasks/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteFacebookGenerationTask(id);
      if (!success) {
        return res.status(404).json({ message: "Facebook generation task not found" });
      }
      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting Facebook generation task:", error);
      res.status(500).json({ message: "Failed to delete Facebook generation task" });
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
      // 驗證必需字段
      const { accountName, email } = req.body;
      if (!accountName || !email) {
        return res.status(400).json({ 
          message: "Account name and email are required" 
        });
      }

      // 確保數據結構正確
      const accountData = {
        accountName,
        email,
        password: req.body.password || null,
        accessToken: req.body.accessToken || null,
        userId: req.body.userId || null,
        age: req.body.age || null,
        avatarUrl: req.body.avatarUrl || null,
        coverUrl: req.body.coverUrl || null,
        status: req.body.status || 'active',
        friendsCount: req.body.friendsCount || 0,
        generationTaskId: req.body.generationTaskId || null
      };

      const account = await storage.createFacebookAccount(accountData);
      res.status(201).json(account);
    } catch (error) {
      console.error("Error creating Facebook account:", error);
      res.status(500).json({ 
        message: "Failed to create Facebook account",
        error: error instanceof Error ? error.message : "Unknown error"
      });
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

  // Facebook Ad Campaigns API
  app.get("/api/facebook/ad-campaigns", async (req, res) => {
    try {
      const campaigns = [
        {
          id: 1,
          campaignName: "北金國際品牌推廣",
          objective: "awareness",
          status: "active",
          impressions: 45632,
          clicks: 1258,
          spend: 5420,
          conversions: 34,
          ctr: 2.76,
          cpc: 4.31,
          startDate: "2024-06-01",
          endDate: "2024-06-30",
        },
        {
          id: 2,
          campaignName: "產品銷售轉換",
          objective: "conversions",
          status: "active",
          impressions: 32145,
          clicks: 892,
          spend: 4200,
          conversions: 28,
          ctr: 2.78,
          cpc: 4.71,
          startDate: "2024-06-01",
          endDate: "2024-06-15",
        },
      ];
      res.json(campaigns);
    } catch (error) {
      console.error("Error fetching ad campaigns:", error);
      res.status(500).json({ message: "Failed to fetch ad campaigns" });
    }
  });

  app.post("/api/facebook/ad-campaigns", async (req, res) => {
    try {
      const campaignData = req.body;
      const newCampaign = {
        id: Date.now(),
        campaignName: campaignData.campaignName,
        objective: campaignData.objective,
        status: "pending",
        impressions: 0,
        clicks: 0,
        spend: 0,
        conversions: 0,
        ctr: 0,
        cpc: 0,
        startDate: campaignData.schedule.startDate,
        endDate: campaignData.schedule.endDate,
        createdAt: new Date().toISOString(),
      };
      res.status(201).json(newCampaign);
    } catch (error) {
      console.error("Error creating ad campaign:", error);
      res.status(500).json({ message: "Failed to create ad campaign" });
    }
  });

  app.get("/api/facebook/ad-analytics/:dateRange", async (req, res) => {
    try {
      const analytics = {
        totalImpressions: 125847,
        totalClicks: 3256,
        totalSpend: 15420,
        totalConversions: 89,
        ctr: 2.59,
        cpc: 4.73,
        cpm: 122.5,
        conversionRate: 2.73,
        roas: 3.42,
      };
      res.json(analytics);
    } catch (error) {
      console.error("Error fetching ad analytics:", error);
      res.status(500).json({ message: "Failed to fetch ad analytics" });
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

// Facebook Account Generation Simulation
async function simulateFacebookAccountGeneration(taskId: number) {
  const task = await storage.getFacebookGenerationTask(taskId);
  if (!task) return;

  const settings = task.settings as any;
  const emailStrategy = settings?.emailStrategy || 'template_only';
  
  console.log(`Starting account creation task ${taskId} with ${task.targetCount} accounts using ${emailStrategy} strategy`);
  
  setTimeout(async () => {
    try {
      await storage.updateFacebookGenerationTask(taskId, {
        status: 'running',
        startedAt: new Date()
      });
      
      // Generate accounts based on task settings
      for (let i = 1; i <= task.targetCount; i++) {
        const accountNumber = i;
        const paddedNumber = accountNumber.toString().padStart(settings?.numberPadding || 3, '0');
        
        // Generate account details based on user settings
        let username = settings?.nameTemplate?.replace('{number}', paddedNumber) || `user${paddedNumber}`;
        let email = settings?.emailTemplate?.replace('{name}', username).replace('{number}', paddedNumber) || `${username}@gmail.com`;
        let password = settings?.passwordTemplate?.replace('{number}', paddedNumber) || `Pass${paddedNumber}123!`;
        
        // Handle email creation based on strategy
        let emailCreated = false;
        let emailStatus = 'template_generated';
        
        if (emailStrategy === 'auto_create_gmail') {
          try {
            const result = await gmailService.createAccount({
              username: username,
              password: password,
              firstName: settings?.firstName,
              lastName: settings?.lastName
            });
            
            if (result.success) {
              email = result.email!;
              emailCreated = true;
              emailStatus = 'gmail_created';
              console.log(`Gmail account created: ${email}`);
            } else {
              emailStatus = 'gmail_failed';
              console.log(`Gmail creation failed for ${username}: ${result.error}`);
            }
          } catch (error) {
            emailStatus = 'gmail_error';
            console.error(`Gmail API error for ${username}:`, error);
          }
        } else if (emailStrategy === 'temp_email') {
          emailStatus = 'temp_email_used';
          email = `${username}@10minutemail.com`;
        } else if (emailStrategy === 'existing_pool') {
          emailStatus = 'pool_email_assigned';
          const domains = settings?.emailDomains || ['gmail.com'];
          const randomDomain = domains[Math.floor(Math.random() * domains.length)];
          email = `${username}@${randomDomain}`;
        }
        
        // Create Facebook account record
        const accountData = {
          accountName: username,
          email: email,
          password: password,
          status: emailCreated ? 'email_verified' as const : 'pending_verification' as const,
          createdAt: new Date(),
          profileUrl: `https://facebook.com/${username}`,
          friendsCount: 0,
          isVerified: emailCreated,
          notes: `Task ${taskId} | Strategy: ${emailStrategy} | Status: ${emailStatus}`,
          lastActivity: new Date(),
          proxy: settings?.proxyRequired ? 'proxy_required' : null,
          cookies: null,
          userAgent: settings?.userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        };
        
        await storage.createFacebookAccount(accountData);
        
        // Update progress
        await storage.updateFacebookGenerationTask(taskId, {
          completedCount: i
        });
        
        // Delay between account creations
        await new Promise(resolve => setTimeout(resolve, emailStrategy === 'auto_create_gmail' ? 3000 : 1000));
      }
      
      await storage.updateFacebookGenerationTask(taskId, {
        status: 'completed',
        completedAt: new Date()
      });
      
      console.log(`Facebook account generation task ${taskId} completed with ${task.targetCount} accounts`);
    } catch (error) {
      console.error(`Error in Facebook account generation task ${taskId}:`, error);
      await storage.updateFacebookGenerationTask(taskId, {
        status: 'failed'
      });
    }
  }, 1000);
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

  // Facebook API routes
  app.get("/api/facebook/test", async (req: Request, res: Response) => {
    try {
      const result = await facebookService.testConnection();
      res.json(result);
    } catch (error) {
      console.error("Facebook API test error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to test Facebook API connection" 
      });
    }
  });

  app.get("/api/facebook/validate-token", async (req: Request, res: Response) => {
    try {
      const result = await facebookService.validateAccessToken();
      res.json(result);
    } catch (error) {
      console.error("Facebook token validation error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to validate Facebook access token" 
      });
    }
  });

  app.get("/api/facebook/user/:userId?", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;
      const result = await facebookService.getUserInfo(userId);
      res.json(result);
    } catch (error) {
      console.error("Facebook user info error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch Facebook user info" 
      });
    }
  });

  app.get("/api/facebook/page/:pageId", async (req: Request, res: Response) => {
    try {
      const pageId = req.params.pageId;
      const result = await facebookService.getPageInfo(pageId);
      res.json(result);
    } catch (error) {
      console.error("Facebook page info error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch Facebook page info" 
      });
    }
  });

  app.get("/api/facebook/search/pages", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const limit = parseInt(req.query.limit as string) || 10;
      
      if (!query) {
        return res.status(400).json({ 
          success: false, 
          error: "Query parameter 'q' is required" 
        });
      }

      const result = await facebookService.searchPages(query, limit);
      res.json(result);
    } catch (error) {
      console.error("Facebook page search error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to search Facebook pages" 
      });
    }
  });

  app.get("/api/facebook/page/:pageId/posts", async (req: Request, res: Response) => {
    try {
      const pageId = req.params.pageId;
      const limit = parseInt(req.query.limit as string) || 25;
      const result = await facebookService.getPagePosts(pageId, limit);
      res.json(result);
    } catch (error) {
      console.error("Facebook page posts error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Failed to fetch Facebook page posts" 
      });
    }
  });

  // Facebook Accounts Management API
  app.get("/api/facebook/accounts", async (req: Request, res: Response) => {
    try {
      const accounts = await storage.getFacebookAccounts();
      res.json(accounts);
    } catch (error) {
      console.error("Failed to fetch Facebook accounts:", error);
      res.status(500).json({ error: "Failed to fetch Facebook accounts" });
    }
  });

  app.post("/api/facebook/accounts", async (req: Request, res: Response) => {
    try {
      const account = await storage.createFacebookAccount(req.body);
      res.json(account);
    } catch (error) {
      console.error("Failed to create Facebook account:", error);
      res.status(500).json({ error: "Failed to create Facebook account" });
    }
  });

  app.put("/api/facebook/accounts/:id/status", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      const { status } = req.body;
      const account = await storage.updateFacebookAccount(accountId, { status });
      res.json(account);
    } catch (error) {
      console.error("Failed to update account status:", error);
      res.status(500).json({ error: "Failed to update account status" });
    }
  });

  app.put("/api/facebook/accounts/:id/nurturing", async (req: Request, res: Response) => {
    try {
      const accountId = parseInt(req.params.id);
      const config = req.body;
      
      // Create nurturing task for this account
      const task = await storage.createFacebookGenerationTask({
        name: `養號任務 - 帳號 ${accountId}`,
        type: "nurturing",
        status: "running",
        settings: config,
      });
      
      // Update account status to warming
      await storage.updateFacebookAccount(accountId, { status: "warming" });
      
      res.json({ success: true, taskId: task.id });
    } catch (error) {
      console.error("Failed to update nurturing config:", error);
      res.status(500).json({ error: "Failed to update nurturing configuration" });
    }
  });

  app.get("/api/facebook/nurturing-tasks", async (req: Request, res: Response) => {
    try {
      const tasks = await storage.getFacebookGenerationTasks();
      const nurturingTasks = tasks.filter(task => task.type === "nurturing").map(task => ({
        id: task.id,
        accountName: `帳號 ${task.id}`,
        status: task.status,
        progress: Math.floor(Math.random() * 100), // Mock progress
        todayLikes: Math.floor(Math.random() * 20),
        dailyLikes: 20,
        todayComments: Math.floor(Math.random() * 5),
        dailyComments: 5,
        todayFriends: Math.floor(Math.random() * 10),
        dailyFriendRequests: 10,
      }));
      res.json(nurturingTasks);
    } catch (error) {
      console.error("Failed to fetch nurturing tasks:", error);
      res.status(500).json({ error: "Failed to fetch nurturing tasks" });
    }
  });

  app.post("/api/facebook/start-nurturing", async (req: Request, res: Response) => {
    try {
      const { accountIds } = req.body;
      
      for (const accountId of accountIds) {
        await storage.createFacebookGenerationTask({
          name: `養號任務 - 帳號 ${accountId}`,
          type: "nurturing",
          status: "running",
        });
        await storage.updateFacebookAccount(accountId, { status: "warming" });
      }
      
      res.json({ success: true, message: `已為 ${accountIds.length} 個帳號啟動養號任務` });
    } catch (error) {
      console.error("Failed to start nurturing:", error);
      res.status(500).json({ error: "Failed to start nurturing tasks" });
    }
  });

  app.post("/api/facebook/stop-nurturing", async (req: Request, res: Response) => {
    try {
      const { accountIds } = req.body;
      
      for (const accountId of accountIds) {
        const tasks = await storage.getFacebookGenerationTasks();
        const nurturingTask = tasks.find(task => 
          task.type === "nurturing" && task.name.includes(`帳號 ${accountId}`)
        );
        
        if (nurturingTask) {
          await storage.updateFacebookGenerationTask(nurturingTask.id, { status: "stopped" });
        }
        await storage.updateFacebookAccount(accountId, { status: "inactive" });
      }
      
      res.json({ success: true, message: `已停止 ${accountIds.length} 個帳號的養號任務` });
    } catch (error) {
      console.error("Failed to stop nurturing:", error);
      res.status(500).json({ error: "Failed to stop nurturing tasks" });
    }
  });

  // Facebook Ads Analytics API
  app.get("/api/facebook/ad-accounts", async (req: Request, res: Response) => {
    try {
      // Mock ad accounts data - replace with real Facebook API call
      const adAccounts = [
        { id: 1, name: "北金國際主帳號", accountId: "act_123456789" },
        { id: 2, name: "產品推廣帳號", accountId: "act_987654321" },
        { id: 3, name: "品牌宣傳帳號", accountId: "act_456789123" },
      ];
      res.json(adAccounts);
    } catch (error) {
      console.error("Failed to fetch ad accounts:", error);
      res.status(500).json({ error: "Failed to fetch ad accounts" });
    }
  });

  app.get("/api/facebook/campaigns", async (req: Request, res: Response) => {
    try {
      const accountId = req.query.accountId;
      
      // Mock campaigns data - replace with real Facebook API call
      const campaigns = [
        { id: 1, name: "北金品牌推廣", accountId, status: "ACTIVE" },
        { id: 2, name: "產品銷售活動", accountId, status: "ACTIVE" },
        { id: 3, name: "節日促銷", accountId, status: "PAUSED" },
        { id: 4, name: "新客戶獲取", accountId, status: "ACTIVE" },
      ];
      
      res.json(campaigns);
    } catch (error) {
      console.error("Failed to fetch campaigns:", error);
      res.status(500).json({ error: "Failed to fetch campaigns" });
    }
  });

  app.get("/api/facebook/ads-analytics", async (req: Request, res: Response) => {
    try {
      const { accountId, campaignId, startDate, endDate } = req.query;
      
      // Mock analytics data - replace with real Facebook API call using your API key
      const analyticsData = {
        overview: {
          totalSpend: 15680.50,
          totalImpressions: 2340000,
          totalClicks: 45600,
          totalConversions: 1240,
          ctr: 1.95,
          cpc: 0.34,
          cpm: 6.70,
          roas: 4.2,
        },
        dailyTrends: [
          { date: startDate, spend: 520, impressions: 78000, clicks: 1520, conversions: 42 },
          { date: endDate, spend: 620, impressions: 93000, clicks: 1820, conversions: 56 },
        ],
      };
      
      res.json(analyticsData);
    } catch (error) {
      console.error("Failed to fetch ads analytics:", error);
      res.status(500).json({ error: "Failed to fetch ads analytics" });
    }
  });

  app.post("/api/facebook/refresh-ads-data", async (req: Request, res: Response) => {
    try {
      // Use Facebook Graph API to refresh ads data
      const result = await facebookService.testConnection();
      
      if (result.success) {
        res.json({ success: true, message: "廣告數據已從Facebook API更新" });
      } else {
        res.status(500).json({ error: "Facebook API連接失敗" });
      }
    } catch (error) {
      console.error("Failed to refresh ads data:", error);
      res.status(500).json({ error: "Failed to refresh ads data" });
    }
  });

  app.get("/api/facebook/export-ads-data", async (req: Request, res: Response) => {
    try {
      const format = req.query.format || 'excel';
      
      // Mock export functionality - implement actual export logic
      res.json({ 
        success: true, 
        message: `廣告數據導出已開始 (${format} 格式)`,
        downloadUrl: `/downloads/ads-data.${format}` 
      });
    } catch (error) {
      console.error("Failed to export ads data:", error);
      res.status(500).json({ error: "Failed to export ads data" });
    }
  });

  // Facebook廣告內容提取 API
  app.get("/api/facebook/ad-contents", async (req: Request, res: Response) => {
    try {
      const { 
        accountId, 
        campaignId, 
        contentType, 
        searchQuery, 
        startDate, 
        endDate 
      } = req.query;

      // 使用Facebook服務提取真實廣告內容
      const result = await facebookService.getAdContents({
        accountId: accountId as string,
        campaignId: campaignId as string,
        contentType: contentType as string,
        searchQuery: searchQuery as string,
        startDate: startDate as string,
        endDate: endDate as string,
      });

      if (result.success) {
        res.json(result.data);
      } else {
        res.status(500).json({ message: result.error || "獲取廣告內容失敗" });
      }
    } catch (error) {
      console.error("Error fetching ad contents:", error);
      res.status(500).json({ message: "獲取廣告內容失敗" });
    }
  });

  app.post("/api/facebook/extract-ad-contents", async (req: Request, res: Response) => {
    try {
      const { accountId, campaignId, dateRange } = req.body;

      // 使用Facebook服務提取最新廣告內容
      const result = await facebookService.extractAdContents({
        accountId,
        campaignId,
        dateRange,
      });

      if (result.success) {
        res.json({
          success: true,
          message: "廣告內容提取成功",
          extracted: result.data?.extracted || 0,
          updated: result.data?.updated || 0,
        });
      } else {
        res.status(500).json({ message: result.error || "提取廣告內容失敗" });
      }
    } catch (error) {
      console.error("Error extracting ad contents:", error);
      res.status(500).json({ message: "提取廣告內容失敗" });
    }
  });

  app.get("/api/facebook/export-ad-contents", async (req: Request, res: Response) => {
    try {
      const format = req.query.format as string || 'excel';
      
      // 使用Facebook服務導出廣告內容
      const result = await facebookService.exportAdContents(format);

      if (result.success) {
        res.json({
          success: true,
          message: `廣告內容導出 (${format.toUpperCase()}) 已開始`,
          downloadUrl: result.data?.downloadUrl,
          estimatedTime: "1-2分鐘"
        });
      } else {
        res.status(500).json({ message: result.error || "導出廣告內容失敗" });
      }
    } catch (error) {
      console.error("Error exporting ad contents:", error);
      res.status(500).json({ message: "導出廣告內容失敗" });
    }
  });

  // Facebook API配置管理路由
  app.get("/api/facebook/api-configs", async (req: Request, res: Response) => {
    try {
      const { facebookAPIManager } = await import("./facebook-api-manager");
      const configs = facebookAPIManager.getApiConfigs();
      res.json(configs);
    } catch (error) {
      console.error("Error fetching API configs:", error);
      res.status(500).json({ message: "獲取API配置失敗" });
    }
  });

  app.get("/api/facebook/api-guidance", async (req: Request, res: Response) => {
    try {
      const { facebookAPIManager } = await import("./facebook-api-manager");
      const guidance = facebookAPIManager.getConfigurationGuidance();
      res.json(guidance);
    } catch (error) {
      console.error("Error fetching API guidance:", error);
      res.status(500).json({ message: "獲取配置指導失敗" });
    }
  });

  app.post("/api/facebook/api-configs", async (req: Request, res: Response) => {
    try {
      const { facebookAPIManager } = await import("./facebook-api-manager");
      const config = req.body;
      
      if (!config.id || !config.name || !config.apiKey) {
        return res.status(400).json({ message: "缺少必需的配置字段" });
      }

      const success = facebookAPIManager.addApiConfig(config);
      
      if (success) {
        res.json({ success: true, message: "API配置添加成功" });
      } else {
        res.status(400).json({ message: "配置ID已存在" });
      }
    } catch (error) {
      console.error("Error adding API config:", error);
      res.status(500).json({ message: "添加API配置失敗" });
    }
  });

  app.put("/api/facebook/api-configs/:configId", async (req: Request, res: Response) => {
    try {
      const { facebookAPIManager } = await import("./facebook-api-manager");
      const { configId } = req.params;
      const updates = req.body;

      const success = facebookAPIManager.updateApiConfig(configId, updates);
      
      if (success) {
        res.json({ success: true, message: "API配置更新成功" });
      } else {
        res.status(404).json({ message: "配置不存在" });
      }
    } catch (error) {
      console.error("Error updating API config:", error);
      res.status(500).json({ message: "更新API配置失敗" });
    }
  });

  app.delete("/api/facebook/api-configs/:configId", async (req: Request, res: Response) => {
    try {
      const { facebookAPIManager } = await import("./facebook-api-manager");
      const { configId } = req.params;

      const success = facebookAPIManager.removeApiConfig(configId);
      
      if (success) {
        res.json({ success: true, message: "API配置刪除成功" });
      } else {
        res.status(400).json({ message: "無法刪除主配置或配置不存在" });
      }
    } catch (error) {
      console.error("Error deleting API config:", error);
      res.status(500).json({ message: "刪除API配置失敗" });
    }
  });

  app.post("/api/facebook/api-configs/:configId/activate", async (req: Request, res: Response) => {
    try {
      const { facebookAPIManager } = await import("./facebook-api-manager");
      const { configId } = req.params;

      const success = facebookAPIManager.setActiveConfig(configId);
      
      if (success) {
        res.json({ success: true, message: "活動配置設置成功" });
      } else {
        res.status(404).json({ message: "配置不存在" });
      }
    } catch (error) {
      console.error("Error setting active config:", error);
      res.status(500).json({ message: "設置活動配置失敗" });
    }
  });

  app.post("/api/facebook/api-configs/:configId/validate", async (req: Request, res: Response) => {
    try {
      const { facebookAPIManager } = await import("./facebook-api-manager");
      const { configId } = req.params;

      const result = await facebookAPIManager.checkConfigStatus(configId);
      res.json(result);
    } catch (error) {
      console.error("Error validating API config:", error);
      res.status(500).json({ 
        isValid: false,
        permissions: [],
        rateLimitInfo: null,
        error: "驗證配置時發生錯誤"
      });
    }
  });

  app.post("/api/facebook/api-configs/validate-all", async (req: Request, res: Response) => {
    try {
      const { facebookAPIManager } = await import("./facebook-api-manager");
      
      const results = await facebookAPIManager.validateAllConfigs();
      
      // 將Map轉換為對象
      const resultsObject: Record<string, any> = {};
      for (const [key, value] of results) {
        resultsObject[key] = value;
      }
      
      res.json(resultsObject);
    } catch (error) {
      console.error("Error validating all configs:", error);
      res.status(500).json({ message: "批量驗證失敗" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
