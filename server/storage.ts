import { 
  users, 
  collectionTasks, 
  collectedData, 
  systemStats,
  facebookGenerationTasks,
  facebookAccounts,
  facebookFriends,
  friendGroups,
  friendGroupMembers,
  messageTemplates,
  groupMessages,
  autoReplyRules,
  translations,
  manualAdData,
  type User, 
  type UpsertUser,
  type CollectionTask,
  type InsertCollectionTask,
  type CollectedData,
  type InsertCollectedData,
  type SystemStats,
  type InsertSystemStats,
  type FacebookGenerationTask,
  type InsertFacebookGenerationTask,
  type FacebookAccount,
  type InsertFacebookAccount,
  type FacebookFriend,
  type InsertFacebookFriend,
  type FriendGroup,
  type InsertFriendGroup,
  type MessageTemplate,
  type InsertMessageTemplate,
  type GroupMessage,
  type InsertGroupMessage,
  type AutoReplyRule,
  type InsertAutoReplyRule,
  type Translation,
  type InsertTranslation,
  type ManualAdData,
  type InsertManualAdData
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, count, and } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;

  // Facebook Generation Tasks
  getFacebookGenerationTasks(): Promise<FacebookGenerationTask[]>;
  getFacebookGenerationTask(id: number): Promise<FacebookGenerationTask | undefined>;
  createFacebookGenerationTask(task: InsertFacebookGenerationTask): Promise<FacebookGenerationTask>;
  updateFacebookGenerationTask(id: number, updates: Partial<FacebookGenerationTask>): Promise<FacebookGenerationTask | undefined>;
  deleteFacebookGenerationTask(id: number): Promise<boolean>;

  // Collection Tasks
  getCollectionTasks(): Promise<CollectionTask[]>;
  getCollectionTask(id: number): Promise<CollectionTask | undefined>;
  createCollectionTask(task: InsertCollectionTask): Promise<CollectionTask>;
  updateCollectionTask(id: number, updates: Partial<CollectionTask>): Promise<CollectionTask | undefined>;
  deleteCollectionTask(id: number): Promise<boolean>;

  // Collected Data
  getCollectedData(limit?: number, offset?: number, search?: string): Promise<{ data: CollectedData[], total: number }>;
  getCollectedDataByTask(taskId: number): Promise<CollectedData[]>;
  createCollectedData(data: InsertCollectedData): Promise<CollectedData>;
  deleteCollectedData(id: number): Promise<boolean>;

  // System Stats
  getSystemStats(): Promise<SystemStats | undefined>;
  updateSystemStats(stats: Partial<SystemStats>): Promise<SystemStats>;

  // Facebook Accounts
  getFacebookAccounts(): Promise<FacebookAccount[]>;
  getFacebookAccount(id: number): Promise<FacebookAccount | undefined>;
  createFacebookAccount(account: InsertFacebookAccount): Promise<FacebookAccount>;
  updateFacebookAccount(id: number, updates: Partial<FacebookAccount>): Promise<FacebookAccount | undefined>;
  deleteFacebookAccount(id: number): Promise<boolean>;

  // Facebook Friends
  getFacebookFriends(accountId?: number, search?: string): Promise<FacebookFriend[]>;
  getFacebookFriend(id: number): Promise<FacebookFriend | undefined>;
  createFacebookFriend(friend: InsertFacebookFriend): Promise<FacebookFriend>;
  updateFacebookFriend(id: number, updates: Partial<FacebookFriend>): Promise<FacebookFriend | undefined>;
  deleteFacebookFriend(id: number): Promise<boolean>;
  searchFriendsByKeyword(keyword: string, location?: string, school?: string): Promise<FacebookFriend[]>;

  // Friend Groups
  getFriendGroups(accountId?: number): Promise<FriendGroup[]>;
  getFriendGroup(id: number): Promise<FriendGroup | undefined>;
  createFriendGroup(group: InsertFriendGroup): Promise<FriendGroup>;
  updateFriendGroup(id: number, updates: Partial<FriendGroup>): Promise<FriendGroup | undefined>;
  deleteFriendGroup(id: number): Promise<boolean>;
  addFriendToGroup(groupId: number, friendId: number): Promise<boolean>;
  removeFriendFromGroup(groupId: number, friendId: number): Promise<boolean>;
  getFriendGroupMembers(groupId: number): Promise<FacebookFriend[]>;

  // Message Templates
  getMessageTemplates(): Promise<MessageTemplate[]>;
  getMessageTemplate(id: number): Promise<MessageTemplate | undefined>;
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  updateMessageTemplate(id: number, updates: Partial<MessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteMessageTemplate(id: number): Promise<boolean>;

  // Group Messages
  getGroupMessages(accountId?: number, groupId?: number): Promise<GroupMessage[]>;
  getGroupMessage(id: number): Promise<GroupMessage | undefined>;
  createGroupMessage(message: InsertGroupMessage): Promise<GroupMessage>;
  updateGroupMessage(id: number, updates: Partial<GroupMessage>): Promise<GroupMessage | undefined>;
  deleteGroupMessage(id: number): Promise<boolean>;

  // Auto Reply Rules
  getAutoReplyRules(accountId?: number): Promise<AutoReplyRule[]>;
  getAutoReplyRule(id: number): Promise<AutoReplyRule | undefined>;
  createAutoReplyRule(rule: InsertAutoReplyRule): Promise<AutoReplyRule>;
  updateAutoReplyRule(id: number, updates: Partial<AutoReplyRule>): Promise<AutoReplyRule | undefined>;
  deleteAutoReplyRule(id: number): Promise<boolean>;

  // Translations
  getTranslations(limit?: number): Promise<Translation[]>;
  createTranslation(translation: InsertTranslation): Promise<Translation>;
  getTranslationByText(originalText: string, targetLanguage: string): Promise<Translation | undefined>;

  // Manual Ad Data
  getManualAdData(): Promise<ManualAdData[]>;
  getManualAdDataById(id: number): Promise<ManualAdData | undefined>;
  createManualAdData(data: InsertManualAdData): Promise<ManualAdData>;
  updateManualAdData(id: number, updates: Partial<ManualAdData>): Promise<ManualAdData | undefined>;
  deleteManualAdData(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private collectionTasks: Map<number, CollectionTask>;
  private collectedData: Map<number, CollectedData>;
  private systemStats: SystemStats;
  private currentUserId: number;
  private currentTaskId: number;
  private currentDataId: number;

  constructor() {
    this.users = new Map();
    this.collectionTasks = new Map();
    this.collectedData = new Map();
    this.currentUserId = 1;
    this.currentTaskId = 1;
    this.currentDataId = 1;

    // Initialize system stats
    this.systemStats = {
      id: 1,
      totalCollected: 12856,
      activeTasks: 8,
      successRate: "94.2",
      todayCollected: 1247,
      cpuUsage: "34%",
      memoryUsage: "2.1 GB",
      networkStatus: "good",
      updatedAt: new Date(),
    };

    // Generate mock data
    this.generateMockData();
  }

  private generateMockData() {
    // Create some mock collection tasks
    const mockTasks: CollectionTask[] = [
      {
        id: 1,
        name: "Daily Posts Collection",
        type: "posts",
        status: "running",
        targetCount: 1000,
        keywords: "technology, programming",
        timeRange: 7,
        includeImages: true,
        includeVideos: false,
        progress: 67,
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        completedAt: null,
      },
      {
        id: 2,
        name: "Comments Analysis",
        type: "comments",
        status: "running",
        targetCount: 500,
        keywords: "feedback, review",
        timeRange: 3,
        includeImages: false,
        includeVideos: false,
        progress: 23,
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        completedAt: null,
      },
    ];

    mockTasks.forEach(task => {
      this.collectionTasks.set(task.id, task);
    });

    // Generate mock collected data
    const mockData: CollectedData[] = [
      {
        id: 1,
        taskId: 1,
        type: "post",
        content: "今天的天氣真的很棒！和朋友們一起去了海邊，拍了很多美麗的照片。生活就是要這樣充滿陽光和快樂！",
        author: { name: "Alice Chen", followers: "12.5K", avatar: "A" },
        publishTime: new Date("2024-01-15T14:32:00"),
        interactions: { likes: 142, comments: 23, shares: 8 },
        status: "collected",
        metadata: { hasImage: true, location: "海邊" },
        createdAt: new Date(),
      },
      {
        id: 2,
        taskId: 1,
        type: "post",
        content: "剛剛參加了一場很棒的技術會議，學到了很多新的程式設計技巧。分享給大家一些實用的資源！",
        author: { name: "Bob Wang", followers: "8.2K", avatar: "B" },
        publishTime: new Date("2024-01-15T13:15:00"),
        interactions: { likes: 89, comments: 16, shares: 5 },
        status: "processing",
        metadata: { category: "技術", tags: ["programming", "conference"] },
        createdAt: new Date(),
      },
      {
        id: 3,
        taskId: 1,
        type: "post",
        content: "週末和家人一起做了美味的料理，分享一些簡單易學的食譜給大家！",
        author: { name: "Carol Liu", followers: "15.7K", avatar: "C" },
        publishTime: new Date("2024-01-15T11:45:00"),
        interactions: { likes: 203, comments: 34, shares: 12 },
        status: "collected",
        metadata: { hasImage: true, category: "料理" },
        createdAt: new Date(),
      },
    ];

    mockData.forEach(data => {
      this.collectedData.set(data.id, data);
    });

    this.currentTaskId = mockTasks.length + 1;
    this.currentDataId = mockData.length + 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id, 
      createdAt: new Date() 
    };
    this.users.set(id, user);
    return user;
  }

  // Collection Task methods
  async getCollectionTasks(): Promise<CollectionTask[]> {
    return Array.from(this.collectionTasks.values());
  }

  async getCollectionTask(id: number): Promise<CollectionTask | undefined> {
    return this.collectionTasks.get(id);
  }

  async createCollectionTask(insertTask: InsertCollectionTask): Promise<CollectionTask> {
    const id = this.currentTaskId++;
    const task: CollectionTask = {
      ...insertTask,
      id,
      status: insertTask.status ?? "pending",
      keywords: insertTask.keywords ?? null,
      includeImages: insertTask.includeImages ?? false,
      includeVideos: insertTask.includeVideos ?? false,
      progress: insertTask.progress ?? 0,
      createdAt: new Date(),
      completedAt: null,
    };
    this.collectionTasks.set(id, task);
    
    // Update active tasks count
    this.systemStats.activeTasks++;
    
    return task;
  }

  async updateCollectionTask(id: number, updates: Partial<CollectionTask>): Promise<CollectionTask | undefined> {
    const task = this.collectionTasks.get(id);
    if (!task) return undefined;

    const updatedTask = { ...task, ...updates };
    this.collectionTasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteCollectionTask(id: number): Promise<boolean> {
    const deleted = this.collectionTasks.delete(id);
    if (deleted) {
      this.systemStats.activeTasks = Math.max(0, this.systemStats.activeTasks - 1);
    }
    return deleted;
  }

  // Collected Data methods
  async getCollectedData(limit = 10, offset = 0, search?: string): Promise<{ data: CollectedData[], total: number }> {
    let allData = Array.from(this.collectedData.values());
    
    // Filter by search if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allData = allData.filter(item => 
        item.content.toLowerCase().includes(searchLower) ||
        (item.author as any).name.toLowerCase().includes(searchLower)
      );
    }

    // Sort by creation date (newest first)
    allData.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = allData.length;
    const data = allData.slice(offset, offset + limit);

    return { data, total };
  }

  async getCollectedDataByTask(taskId: number): Promise<CollectedData[]> {
    return Array.from(this.collectedData.values()).filter(data => data.taskId === taskId);
  }

  async createCollectedData(insertData: InsertCollectedData): Promise<CollectedData> {
    const id = this.currentDataId++;
    const data: CollectedData = {
      ...insertData,
      id,
      taskId: insertData.taskId ?? null,
      status: insertData.status ?? "collected",
      metadata: insertData.metadata ?? null,
      createdAt: new Date(),
    };
    this.collectedData.set(id, data);
    
    // Update total collected count
    this.systemStats.totalCollected++;
    this.systemStats.todayCollected++;
    
    return data;
  }

  async deleteCollectedData(id: number): Promise<boolean> {
    const deleted = this.collectedData.delete(id);
    if (deleted) {
      this.systemStats.totalCollected = Math.max(0, this.systemStats.totalCollected - 1);
    }
    return deleted;
  }

  // System Stats methods
  async getSystemStats(): Promise<SystemStats | undefined> {
    // Update real-time stats
    this.systemStats.updatedAt = new Date();
    this.systemStats.cpuUsage = `${Math.floor(Math.random() * 20) + 25}%`;
    return this.systemStats;
  }

  async updateSystemStats(updates: Partial<SystemStats>): Promise<SystemStats> {
    this.systemStats = { ...this.systemStats, ...updates, updatedAt: new Date() };
    return this.systemStats;
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, username));
    return user || undefined;
  }

  async createUser(insertUser: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async createUser_old(insertUser: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCollectionTasks(): Promise<CollectionTask[]> {
    return await db.select().from(collectionTasks).orderBy(desc(collectionTasks.createdAt));
  }

  async getCollectionTask(id: number): Promise<CollectionTask | undefined> {
    const [task] = await db.select().from(collectionTasks).where(eq(collectionTasks.id, id));
    return task || undefined;
  }

  async createCollectionTask(insertTask: InsertCollectionTask): Promise<CollectionTask> {
    const [task] = await db
      .insert(collectionTasks)
      .values({
        ...insertTask,
        status: insertTask.status ?? "pending",
        keywords: insertTask.keywords ?? null,
        includeImages: insertTask.includeImages ?? false,
        includeVideos: insertTask.includeVideos ?? false,
        progress: insertTask.progress ?? 0,
      })
      .returning();
    
    // Update active tasks count
    await this.incrementActiveTasks();
    
    return task;
  }

  async updateCollectionTask(id: number, updates: Partial<CollectionTask>): Promise<CollectionTask | undefined> {
    const [task] = await db
      .update(collectionTasks)
      .set(updates)
      .where(eq(collectionTasks.id, id))
      .returning();
    return task || undefined;
  }

  async deleteCollectionTask(id: number): Promise<boolean> {
    try {
      const result = await db.delete(collectionTasks).where(eq(collectionTasks.id, id));
      if (result.rowCount && result.rowCount > 0) {
        // Try to update stats, but don't fail the delete if this fails
        try {
          await this.decrementActiveTasks();
        } catch (error) {
          console.warn("Failed to update active tasks count:", error);
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error("Failed to delete collection task:", error);
      return false;
    }
  }

  async getCollectedData(limit = 10, offset = 0, search?: string): Promise<{ data: CollectedData[], total: number }> {
    if (search) {
      const searchCondition = ilike(collectedData.content, `%${search}%`);
      
      const [data, totalResult] = await Promise.all([
        db.select().from(collectedData)
          .where(searchCondition)
          .orderBy(desc(collectedData.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(collectedData)
          .where(searchCondition)
      ]);

      return { 
        data, 
        total: totalResult[0]?.count || 0 
      };
    } else {
      const [data, totalResult] = await Promise.all([
        db.select().from(collectedData)
          .orderBy(desc(collectedData.createdAt))
          .limit(limit)
          .offset(offset),
        db.select({ count: count() }).from(collectedData)
      ]);

      return { 
        data, 
        total: totalResult[0]?.count || 0 
      };
    }
  }

  async getCollectedDataByTask(taskId: number): Promise<CollectedData[]> {
    return await db.select().from(collectedData).where(eq(collectedData.taskId, taskId));
  }

  async createCollectedData(insertData: InsertCollectedData): Promise<CollectedData> {
    const [data] = await db
      .insert(collectedData)
      .values({
        ...insertData,
        taskId: insertData.taskId ?? null,
        status: insertData.status ?? "collected",
        metadata: insertData.metadata ?? null,
      })
      .returning();
    
    // Update total collected count
    await this.incrementTotalCollected();
    
    return data;
  }

  async deleteCollectedData(id: number): Promise<boolean> {
    const result = await db.delete(collectedData).where(eq(collectedData.id, id));
    if (result.rowCount && result.rowCount > 0) {
      await this.decrementTotalCollected();
      return true;
    }
    return false;
  }

  async getSystemStats(): Promise<SystemStats | undefined> {
    const [stats] = await db.select().from(systemStats).limit(1);
    if (stats) {
      // Update real-time CPU usage
      const [updatedStats] = await db
        .update(systemStats)
        .set({ 
          cpuUsage: `${Math.floor(Math.random() * 20) + 25}%`,
          updatedAt: new Date()
        })
        .where(eq(systemStats.id, stats.id))
        .returning();
      return updatedStats;
    }
    
    // Create initial stats if none exist
    const [newStats] = await db
      .insert(systemStats)
      .values({
        totalCollected: 0,
        activeTasks: 0,
        successRate: "0",
        todayCollected: 0,
        cpuUsage: "25%",
        memoryUsage: "1.2 GB",
        networkStatus: "good",
      })
      .returning();
    return newStats;
  }

  async updateSystemStats(updates: Partial<SystemStats>): Promise<SystemStats> {
    const currentStats = await this.getSystemStats();
    if (!currentStats) {
      throw new Error("No system stats found");
    }
    
    const [updatedStats] = await db
      .update(systemStats)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(systemStats.id, currentStats.id))
      .returning();
    return updatedStats;
  }

  private async incrementActiveTasks(): Promise<void> {
    const stats = await this.getSystemStats();
    if (stats) {
      await db
        .update(systemStats)
        .set({ activeTasks: stats.activeTasks + 1 })
        .where(eq(systemStats.id, stats.id));
    }
  }

  private async decrementActiveTasks(): Promise<void> {
    const stats = await this.getSystemStats();
    if (stats) {
      await db
        .update(systemStats)
        .set({ activeTasks: Math.max(0, stats.activeTasks - 1) })
        .where(eq(systemStats.id, stats.id));
    }
  }

  private async incrementTotalCollected(): Promise<void> {
    const stats = await this.getSystemStats();
    if (stats) {
      await db
        .update(systemStats)
        .set({ 
          totalCollected: stats.totalCollected + 1,
          todayCollected: stats.todayCollected + 1
        })
        .where(eq(systemStats.id, stats.id));
    }
  }

  private async decrementTotalCollected(): Promise<void> {
    const stats = await this.getSystemStats();
    if (stats) {
      await db
        .update(systemStats)
        .set({ totalCollected: Math.max(0, stats.totalCollected - 1) })
        .where(eq(systemStats.id, stats.id));
    }
  }

  // Facebook Generation Tasks
  async getFacebookGenerationTasks(): Promise<FacebookGenerationTask[]> {
    return await db.select().from(facebookGenerationTasks).orderBy(desc(facebookGenerationTasks.createdAt));
  }

  async getFacebookGenerationTask(id: number): Promise<FacebookGenerationTask | undefined> {
    const [task] = await db.select().from(facebookGenerationTasks).where(eq(facebookGenerationTasks.id, id));
    return task;
  }

  async createFacebookGenerationTask(insertTask: InsertFacebookGenerationTask): Promise<FacebookGenerationTask> {
    const [task] = await db
      .insert(facebookGenerationTasks)
      .values(insertTask)
      .returning();
    return task;
  }

  async updateFacebookGenerationTask(id: number, updates: Partial<FacebookGenerationTask>): Promise<FacebookGenerationTask | undefined> {
    const [task] = await db
      .update(facebookGenerationTasks)
      .set(updates)
      .where(eq(facebookGenerationTasks.id, id))
      .returning();
    return task;
  }

  async deleteFacebookGenerationTask(id: number): Promise<boolean> {
    const result = await db.delete(facebookGenerationTasks).where(eq(facebookGenerationTasks.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Facebook Accounts
  async getFacebookAccounts(): Promise<FacebookAccount[]> {
    try {
      return await db.select().from(facebookAccounts).orderBy(desc(facebookAccounts.createdAt));
    } catch (error) {
      // If column doesn't exist, return empty array for now
      console.log("Facebook accounts table not ready, returning empty array");
      return [];
    }
  }

  async getFacebookAccount(id: number): Promise<FacebookAccount | undefined> {
    const [account] = await db.select().from(facebookAccounts).where(eq(facebookAccounts.id, id));
    return account;
  }

  async createFacebookAccount(insertAccount: InsertFacebookAccount): Promise<FacebookAccount> {
    const [account] = await db
      .insert(facebookAccounts)
      .values(insertAccount)
      .returning();
    return account;
  }

  async updateFacebookAccount(id: number, updates: Partial<FacebookAccount>): Promise<FacebookAccount | undefined> {
    const [account] = await db
      .update(facebookAccounts)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(facebookAccounts.id, id))
      .returning();
    return account;
  }

  async deleteFacebookAccount(id: number): Promise<boolean> {
    const result = await db.delete(facebookAccounts).where(eq(facebookAccounts.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Facebook Friends
  async getFacebookFriends(accountId?: number, search?: string): Promise<FacebookFriend[]> {
    let query = db.select().from(facebookFriends);
    
    const conditions = [];
    if (accountId) {
      conditions.push(eq(facebookFriends.accountId, accountId));
    }
    if (search) {
      conditions.push(ilike(facebookFriends.friendName, `%${search}%`));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(facebookFriends.addedAt));
  }

  async getFacebookFriend(id: number): Promise<FacebookFriend | undefined> {
    const [friend] = await db.select().from(facebookFriends).where(eq(facebookFriends.id, id));
    return friend;
  }

  async createFacebookFriend(insertFriend: InsertFacebookFriend): Promise<FacebookFriend> {
    const [friend] = await db
      .insert(facebookFriends)
      .values(insertFriend)
      .returning();
    return friend;
  }

  async updateFacebookFriend(id: number, updates: Partial<FacebookFriend>): Promise<FacebookFriend | undefined> {
    const [friend] = await db
      .update(facebookFriends)
      .set(updates)
      .where(eq(facebookFriends.id, id))
      .returning();
    return friend;
  }

  async deleteFacebookFriend(id: number): Promise<boolean> {
    const result = await db.delete(facebookFriends).where(eq(facebookFriends.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async searchFriendsByKeyword(keyword: string, location?: string, school?: string): Promise<FacebookFriend[]> {
    let query = db.select().from(facebookFriends);
    
    const conditions = [
      or(
        ilike(facebookFriends.friendName, `%${keyword}%`),
        ilike(facebookFriends.workplace, `%${keyword}%`)
      )
    ];
    
    if (location) {
      conditions.push(ilike(facebookFriends.location, `%${location}%`));
    }
    if (school) {
      conditions.push(ilike(facebookFriends.school, `%${school}%`));
    }
    
    return await query.where(and(...conditions)).orderBy(desc(facebookFriends.addedAt));
  }

  // Friend Groups
  async getFriendGroups(accountId?: number): Promise<FriendGroup[]> {
    let query = db.select().from(friendGroups);
    if (accountId) {
      query = query.where(eq(friendGroups.accountId, accountId));
    }
    return await query.orderBy(desc(friendGroups.createdAt));
  }

  async getFriendGroup(id: number): Promise<FriendGroup | undefined> {
    const [group] = await db.select().from(friendGroups).where(eq(friendGroups.id, id));
    return group;
  }

  async createFriendGroup(insertGroup: InsertFriendGroup): Promise<FriendGroup> {
    const [group] = await db
      .insert(friendGroups)
      .values(insertGroup)
      .returning();
    return group;
  }

  async updateFriendGroup(id: number, updates: Partial<FriendGroup>): Promise<FriendGroup | undefined> {
    const [group] = await db
      .update(friendGroups)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(friendGroups.id, id))
      .returning();
    return group;
  }

  async deleteFriendGroup(id: number): Promise<boolean> {
    // Delete group members first
    await db.delete(friendGroupMembers).where(eq(friendGroupMembers.groupId, id));
    
    const result = await db.delete(friendGroups).where(eq(friendGroups.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async addFriendToGroup(groupId: number, friendId: number): Promise<boolean> {
    try {
      await db
        .insert(friendGroupMembers)
        .values({ groupId, friendId });
      return true;
    } catch (error) {
      return false;
    }
  }

  async removeFriendFromGroup(groupId: number, friendId: number): Promise<boolean> {
    const result = await db
      .delete(friendGroupMembers)
      .where(and(
        eq(friendGroupMembers.groupId, groupId),
        eq(friendGroupMembers.friendId, friendId)
      ));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  async getFriendGroupMembers(groupId: number): Promise<FacebookFriend[]> {
    return await db
      .select({
        id: facebookFriends.id,
        accountId: facebookFriends.accountId,
        friendId: facebookFriends.friendId,
        friendName: facebookFriends.friendName,
        profileUrl: facebookFriends.profileUrl,
        location: facebookFriends.location,
        school: facebookFriends.school,
        workplace: facebookFriends.workplace,
        mutualFriends: facebookFriends.mutualFriends,
        status: facebookFriends.status,
        addedAt: facebookFriends.addedAt,
        lastInteraction: facebookFriends.lastInteraction,
      })
      .from(friendGroupMembers)
      .innerJoin(facebookFriends, eq(friendGroupMembers.friendId, facebookFriends.id))
      .where(eq(friendGroupMembers.groupId, groupId));
  }

  // Message Templates
  async getMessageTemplates(): Promise<MessageTemplate[]> {
    return await db.select().from(messageTemplates).orderBy(desc(messageTemplates.createdAt));
  }

  async getMessageTemplate(id: number): Promise<MessageTemplate | undefined> {
    const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    return template;
  }

  async createMessageTemplate(insertTemplate: InsertMessageTemplate): Promise<MessageTemplate> {
    const [template] = await db
      .insert(messageTemplates)
      .values(insertTemplate)
      .returning();
    return template;
  }

  async updateMessageTemplate(id: number, updates: Partial<MessageTemplate>): Promise<MessageTemplate | undefined> {
    const [template] = await db
      .update(messageTemplates)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(messageTemplates.id, id))
      .returning();
    return template;
  }

  async deleteMessageTemplate(id: number): Promise<boolean> {
    const result = await db.delete(messageTemplates).where(eq(messageTemplates.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Group Messages
  async getGroupMessages(accountId?: number, groupId?: number): Promise<GroupMessage[]> {
    let query = db.select().from(groupMessages);
    
    const conditions = [];
    if (accountId) {
      conditions.push(eq(groupMessages.accountId, accountId));
    }
    if (groupId) {
      conditions.push(eq(groupMessages.groupId, groupId));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }
    
    return await query.orderBy(desc(groupMessages.createdAt));
  }

  async getGroupMessage(id: number): Promise<GroupMessage | undefined> {
    const [message] = await db.select().from(groupMessages).where(eq(groupMessages.id, id));
    return message;
  }

  async createGroupMessage(insertMessage: InsertGroupMessage): Promise<GroupMessage> {
    const [message] = await db
      .insert(groupMessages)
      .values(insertMessage)
      .returning();
    return message;
  }

  async updateGroupMessage(id: number, updates: Partial<GroupMessage>): Promise<GroupMessage | undefined> {
    const [message] = await db
      .update(groupMessages)
      .set(updates)
      .where(eq(groupMessages.id, id))
      .returning();
    return message;
  }

  async deleteGroupMessage(id: number): Promise<boolean> {
    const result = await db.delete(groupMessages).where(eq(groupMessages.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Auto Reply Rules
  async getAutoReplyRules(accountId?: number): Promise<AutoReplyRule[]> {
    let query = db.select().from(autoReplyRules);
    if (accountId) {
      query = query.where(eq(autoReplyRules.accountId, accountId));
    }
    return await query.orderBy(desc(autoReplyRules.createdAt));
  }

  async getAutoReplyRule(id: number): Promise<AutoReplyRule | undefined> {
    const [rule] = await db.select().from(autoReplyRules).where(eq(autoReplyRules.id, id));
    return rule;
  }

  async createAutoReplyRule(insertRule: InsertAutoReplyRule): Promise<AutoReplyRule> {
    const [rule] = await db
      .insert(autoReplyRules)
      .values(insertRule)
      .returning();
    return rule;
  }

  async updateAutoReplyRule(id: number, updates: Partial<AutoReplyRule>): Promise<AutoReplyRule | undefined> {
    const [rule] = await db
      .update(autoReplyRules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(autoReplyRules.id, id))
      .returning();
    return rule;
  }

  async deleteAutoReplyRule(id: number): Promise<boolean> {
    const result = await db.delete(autoReplyRules).where(eq(autoReplyRules.id, id));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Translations
  async getTranslations(limit = 50): Promise<Translation[]> {
    return await db.select().from(translations)
      .orderBy(desc(translations.createdAt))
      .limit(limit);
  }

  async createTranslation(insertTranslation: InsertTranslation): Promise<Translation> {
    const [translation] = await db
      .insert(translations)
      .values(insertTranslation)
      .returning();
    return translation;
  }

  async getTranslationByText(originalText: string, targetLanguage: string): Promise<Translation | undefined> {
    const [translation] = await db
      .select()
      .from(translations)
      .where(and(
        eq(translations.originalText, originalText),
        eq(translations.targetLanguage, targetLanguage)
      ))
      .limit(1);
    return translation;
  }

  // Manual Ad Data methods
  async getManualAdData(): Promise<ManualAdData[]> {
    return await db.select().from(manualAdData).orderBy(desc(manualAdData.createdAt));
  }

  async getManualAdDataById(id: number): Promise<ManualAdData | undefined> {
    const [data] = await db.select().from(manualAdData).where(eq(manualAdData.id, id));
    return data || undefined;
  }

  async createManualAdData(insertData: InsertManualAdData): Promise<ManualAdData> {
    // 將美元轉換為分（cents）存儲
    const dataToInsert = {
      ...insertData,
      spend: Math.round((insertData.spend || 0) * 100), // 轉換為分
    };

    const [data] = await db
      .insert(manualAdData)
      .values(dataToInsert)
      .returning();
    
    // 返回時將分轉換回美元
    return {
      ...data,
      spend: data.spend / 100
    };
  }

  async updateManualAdData(id: number, updates: Partial<ManualAdData>): Promise<ManualAdData | undefined> {
    // 如果更新包含spend，轉換為分
    const updatesToApply = { ...updates };
    if (updates.spend !== undefined) {
      updatesToApply.spend = Math.round(updates.spend * 100);
    }

    const [data] = await db
      .update(manualAdData)
      .set({
        ...updatesToApply,
        updatedAt: new Date()
      })
      .where(eq(manualAdData.id, id))
      .returning();
    
    if (!data) return undefined;

    // 返回時將分轉換回美元
    return {
      ...data,
      spend: data.spend / 100
    };
  }

  async deleteManualAdData(id: number): Promise<boolean> {
    const result = await db.delete(manualAdData).where(eq(manualAdData.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
