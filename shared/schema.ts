import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const collectionTasks = pgTable("collection_tasks", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // 'posts', 'comments', 'profiles', 'groups'
  status: text("status").notNull().default('pending'), // 'pending', 'running', 'completed', 'failed'
  targetCount: integer("target_count").notNull(),
  keywords: text("keywords"),
  timeRange: integer("time_range").notNull(), // days
  includeImages: boolean("include_images").default(false),
  includeVideos: boolean("include_videos").default(false),
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const collectedData = pgTable("collected_data", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => collectionTasks.id),
  type: text("type").notNull(), // 'post', 'comment', 'profile', 'group'
  content: text("content").notNull(),
  author: jsonb("author").notNull(), // { name, followers, avatar }
  publishTime: timestamp("publish_time").notNull(),
  interactions: jsonb("interactions").notNull(), // { likes, comments, shares }
  status: text("status").notNull().default('collected'), // 'collected', 'processing', 'analyzed'
  metadata: jsonb("metadata"), // additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const systemStats = pgTable("system_stats", {
  id: serial("id").primaryKey(),
  totalCollected: integer("total_collected").notNull().default(0),
  activeTasks: integer("active_tasks").notNull().default(0),
  successRate: text("success_rate").notNull().default('0'),
  todayCollected: integer("today_collected").notNull().default(0),
  cpuUsage: text("cpu_usage").notNull().default('0%'),
  memoryUsage: text("memory_usage").notNull().default('0 GB'),
  networkStatus: text("network_status").notNull().default('good'),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertCollectionTaskSchema = createInsertSchema(collectionTasks).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export const insertCollectedDataSchema = createInsertSchema(collectedData).omit({
  id: true,
  createdAt: true,
});

export const insertSystemStatsSchema = createInsertSchema(systemStats).omit({
  id: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type CollectionTask = typeof collectionTasks.$inferSelect;
export type InsertCollectionTask = z.infer<typeof insertCollectionTaskSchema>;

export type CollectedData = typeof collectedData.$inferSelect;
export type InsertCollectedData = z.infer<typeof insertCollectedDataSchema>;

export type SystemStats = typeof systemStats.$inferSelect;
export type InsertSystemStats = z.infer<typeof insertSystemStatsSchema>;
