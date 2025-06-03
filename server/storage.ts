import { 
  users, 
  collectionTasks, 
  collectedData, 
  systemStats,
  type User, 
  type InsertUser,
  type CollectionTask,
  type InsertCollectionTask,
  type CollectedData,
  type InsertCollectedData,
  type SystemStats,
  type InsertSystemStats
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, ilike, or, count } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

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
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
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
    const result = await db.delete(collectionTasks).where(eq(collectionTasks.id, id));
    if (result.rowCount && result.rowCount > 0) {
      await this.decrementActiveTasks();
      return true;
    }
    return false;
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
}

export const storage = new DatabaseStorage();
