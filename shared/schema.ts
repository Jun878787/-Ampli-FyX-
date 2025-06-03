import { pgTable, text, serial, integer, boolean, timestamp, jsonb, varchar } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
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

// Relations
export const collectionTasksRelations = relations(collectionTasks, ({ many }) => ({
  collectedData: many(collectedData),
}));

export const collectedDataRelations = relations(collectedData, ({ one }) => ({
  task: one(collectionTasks, {
    fields: [collectedData.taskId],
    references: [collectionTasks.id],
  }),
}));

// Facebook 帳號管理
export const facebookAccounts = pgTable("facebook_accounts", {
  id: serial("id").primaryKey(),
  accountName: varchar("account_name").notNull(),
  email: varchar("email").notNull(),
  accessToken: varchar("access_token"),
  userId: varchar("user_id"),
  status: varchar("status").default("active"), // active, inactive, suspended
  lastLogin: timestamp("last_login"),
  friendsCount: integer("friends_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 好友管理
export const facebookFriends = pgTable("facebook_friends", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => facebookAccounts.id),
  friendId: varchar("friend_id").notNull(),
  friendName: varchar("friend_name").notNull(),
  profileUrl: varchar("profile_url"),
  location: varchar("location"),
  school: varchar("school"),
  workplace: varchar("workplace"),
  mutualFriends: integer("mutual_friends").default(0),
  status: varchar("status").default("pending"), // pending, accepted, rejected, blocked
  addedAt: timestamp("added_at").defaultNow(),
  lastInteraction: timestamp("last_interaction"),
});

// 好友分組
export const friendGroups = pgTable("friend_groups", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => facebookAccounts.id),
  groupName: varchar("group_name").notNull(),
  description: text("description"),
  color: varchar("color").default("#3b82f6"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 好友分組關聯
export const friendGroupMembers = pgTable("friend_group_members", {
  id: serial("id").primaryKey(),
  groupId: integer("group_id").references(() => friendGroups.id),
  friendId: integer("friend_id").references(() => facebookFriends.id),
  addedAt: timestamp("added_at").defaultNow(),
});

// 訊息模板
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  content: text("content").notNull(),
  type: varchar("type").default("text"), // text, image, mixed
  imageUrls: text("image_urls").array(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 群組訊息記錄
export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => facebookAccounts.id),
  groupId: integer("group_id").references(() => friendGroups.id),
  templateId: integer("template_id").references(() => messageTemplates.id),
  messageContent: text("message_content").notNull(),
  imageUrls: text("image_urls").array(),
  recipientCount: integer("recipient_count").default(0),
  sentCount: integer("sent_count").default(0),
  failedCount: integer("failed_count").default(0),
  status: varchar("status").default("pending"), // pending, sending, completed, failed
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// 自動回覆規則
export const autoReplyRules = pgTable("auto_reply_rules", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => facebookAccounts.id),
  ruleName: varchar("rule_name").notNull(),
  keywords: text("keywords").array(),
  replyContent: text("reply_content").notNull(),
  replyImages: text("reply_images").array(),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1),
  maxRepliesPerDay: integer("max_replies_per_day").default(100),
  currentRepliesCount: integer("current_replies_count").default(0),
  lastResetAt: timestamp("last_reset_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// 翻譯記錄
export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  originalText: text("original_text").notNull(),
  translatedText: text("translated_text").notNull(),
  sourceLanguage: varchar("source_language").notNull(),
  targetLanguage: varchar("target_language").notNull(),
  service: varchar("service").default("google"), // google, azure, baidu
  createdAt: timestamp("created_at").defaultNow(),
});

// Facebook 帳號相關類型和插入模式
export const insertFacebookAccountSchema = createInsertSchema(facebookAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertFacebookFriendSchema = createInsertSchema(facebookFriends).omit({
  id: true,
  addedAt: true,
  lastInteraction: true,
});

export const insertFriendGroupSchema = createInsertSchema(friendGroups).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGroupMessageSchema = createInsertSchema(groupMessages).omit({
  id: true,
  sentAt: true,
  createdAt: true,
});

export const insertAutoReplyRuleSchema = createInsertSchema(autoReplyRules).omit({
  id: true,
  currentRepliesCount: true,
  lastResetAt: true,
  createdAt: true,
  updatedAt: true,
});

export const insertTranslationSchema = createInsertSchema(translations).omit({
  id: true,
  createdAt: true,
});

// 類型定義
export type FacebookAccount = typeof facebookAccounts.$inferSelect;
export type InsertFacebookAccount = z.infer<typeof insertFacebookAccountSchema>;

export type FacebookFriend = typeof facebookFriends.$inferSelect;
export type InsertFacebookFriend = z.infer<typeof insertFacebookFriendSchema>;

export type FriendGroup = typeof friendGroups.$inferSelect;
export type InsertFriendGroup = z.infer<typeof insertFriendGroupSchema>;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;

export type AutoReplyRule = typeof autoReplyRules.$inferSelect;
export type InsertAutoReplyRule = z.infer<typeof insertAutoReplyRuleSchema>;

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;

// 關聯定義
export const facebookAccountsRelations = relations(facebookAccounts, ({ many }) => ({
  friends: many(facebookFriends),
  friendGroups: many(friendGroups),
  groupMessages: many(groupMessages),
  autoReplyRules: many(autoReplyRules),
}));

export const facebookFriendsRelations = relations(facebookFriends, ({ one, many }) => ({
  account: one(facebookAccounts, {
    fields: [facebookFriends.accountId],
    references: [facebookAccounts.id],
  }),
  groupMemberships: many(friendGroupMembers),
}));

export const friendGroupsRelations = relations(friendGroups, ({ one, many }) => ({
  account: one(facebookAccounts, {
    fields: [friendGroups.accountId],
    references: [facebookAccounts.id],
  }),
  members: many(friendGroupMembers),
  messages: many(groupMessages),
}));

export const friendGroupMembersRelations = relations(friendGroupMembers, ({ one }) => ({
  group: one(friendGroups, {
    fields: [friendGroupMembers.groupId],
    references: [friendGroups.id],
  }),
  friend: one(facebookFriends, {
    fields: [friendGroupMembers.friendId],
    references: [facebookFriends.id],
  }),
}));

export const messageTemplatesRelations = relations(messageTemplates, ({ many }) => ({
  groupMessages: many(groupMessages),
}));

export const groupMessagesRelations = relations(groupMessages, ({ one }) => ({
  account: one(facebookAccounts, {
    fields: [groupMessages.accountId],
    references: [facebookAccounts.id],
  }),
  group: one(friendGroups, {
    fields: [groupMessages.groupId],
    references: [friendGroups.id],
  }),
  template: one(messageTemplates, {
    fields: [groupMessages.templateId],
    references: [messageTemplates.id],
  }),
}));

export const autoReplyRulesRelations = relations(autoReplyRules, ({ one }) => ({
  account: one(facebookAccounts, {
    fields: [autoReplyRules.accountId],
    references: [facebookAccounts.id],
  }),
}));
