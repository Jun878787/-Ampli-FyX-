import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  serial,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table.
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table.
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Ad campaigns table
export const adCampaigns = pgTable("ad_campaigns", {
  id: varchar("id").primaryKey().notNull(),
  campaignName: varchar("campaign_name").notNull(),
  dailyBudget: integer("daily_budget").notNull(),
  adObjective: varchar("ad_objective").notNull(),
  audience: jsonb("audience").notNull(),
  placement: varchar("placement").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Daily ad data table
export const adDailyData = pgTable("ad_daily_data", {
  id: serial("id").primaryKey(),
  campaignId: varchar("campaign_id").notNull().references(() => adCampaigns.id),
  date: varchar("date").notNull(),
  dailySpend: integer("daily_spend").notNull(),
  views: integer("views").notNull(),
  reach: integer("reach").notNull(),
  interactions: integer("interactions").notNull(),
  followers: integer("followers").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type AdCampaign = typeof adCampaigns.$inferSelect;
export type InsertAdCampaign = typeof adCampaigns.$inferInsert;
export type AdDailyData = typeof adDailyData.$inferSelect;
export type InsertAdDailyData = typeof adDailyData.$inferInsert;

// Collection Tasks
export const collectionTasks = pgTable("collection_tasks", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(), // posts, comments, users, etc
  status: varchar("status").default("pending"), // pending, running, completed, paused
  progress: integer("progress").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export const insertCollectionTaskSchema = createInsertSchema(collectionTasks);

// Collected Data
export const collectedData = pgTable("collected_data", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").references(() => collectionTasks.id),
  type: varchar("type").notNull(),
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertCollectedDataSchema = createInsertSchema(collectedData);

// System Stats
export const systemStats = pgTable("system_stats", {
  id: serial("id").primaryKey(),
  totalCollected: integer("total_collected").default(0),
  activeTasks: integer("active_tasks").default(0),
  successRate: integer("success_rate").default(0),
  todayCollected: integer("today_collected").default(0),
  userProfiles: integer("user_profiles").default(0),
  dataTypes: integer("data_types").default(0),
  lastUpdated: timestamp("last_updated").defaultNow(),
});

export const insertSystemStatsSchema = createInsertSchema(systemStats);

export type CollectionTask = typeof collectionTasks.$inferSelect;
export type InsertCollectionTask = z.infer<typeof insertCollectionTaskSchema>;

export type CollectedData = typeof collectedData.$inferSelect;
export type InsertCollectedData = z.infer<typeof insertCollectedDataSchema>;

export type SystemStats = typeof systemStats.$inferSelect;
export type InsertSystemStats = z.infer<typeof insertSystemStatsSchema>;

// Facebook 帳號生成任務
export const facebookGenerationTasks = pgTable("facebook_generation_tasks", {
  id: serial("id").primaryKey(),
  name: varchar("name").notNull(),
  type: varchar("type").notNull(),
  targetCount: integer("target_count").notNull(),
  completedCount: integer("completed_count").default(0),
  settings: jsonb("settings"),
  status: varchar("status").default("pending"), // pending, running, completed, paused, failed
  createdAt: timestamp("created_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
});

export const insertFacebookGenerationTaskSchema = createInsertSchema(facebookGenerationTasks);

export type FacebookGenerationTask = typeof facebookGenerationTasks.$inferSelect;
export type InsertFacebookGenerationTask = z.infer<typeof insertFacebookGenerationTaskSchema>;

// Facebook 帳號管理
export const facebookAccounts = pgTable("facebook_accounts", {
  id: serial("id").primaryKey(),
  generationTaskId: integer("generation_task_id").references(() => facebookGenerationTasks.id),
  accountName: varchar("account_name").notNull(),
  email: varchar("email").notNull(),
  password: varchar("password"),
  accessToken: varchar("access_token"),
  userId: varchar("user_id"),
  age: integer("age"),
  avatarUrl: varchar("avatar_url"),
  coverUrl: varchar("cover_url"),
  status: varchar("status").default("active"), // active, inactive, suspended
  lastLogin: timestamp("last_login"),
  friendsCount: integer("friends_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFacebookAccountSchema = createInsertSchema(facebookAccounts);

export type FacebookAccount = typeof facebookAccounts.$inferSelect;
export type InsertFacebookAccount = z.infer<typeof insertFacebookAccountSchema>;

// Facebook 好友管理
export const facebookFriends = pgTable("facebook_friends", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => facebookAccounts.id),
  friendId: varchar("friend_id").notNull(),
  friendName: varchar("friend_name").notNull(),
  profileUrl: varchar("profile_url"),
  location: varchar("location"),
  school: varchar("school"),
  workplace: varchar("workplace"),
  relationshipStatus: varchar("relationship_status"),
  mutualFriends: integer("mutual_friends").default(0),
  lastInteraction: timestamp("last_interaction"),
  friendshipDate: timestamp("friendship_date"),
  status: varchar("status").default("active"), // active, blocked, removed
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFacebookFriendSchema = createInsertSchema(facebookFriends);

export type FacebookFriend = typeof facebookFriends.$inferSelect;
export type InsertFacebookFriend = z.infer<typeof insertFacebookFriendSchema>;

// 好友分組
export const friendGroups = pgTable("friend_groups", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => facebookAccounts.id),
  groupName: varchar("group_name").notNull(),
  description: text("description"),
  memberCount: integer("member_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertFriendGroupSchema = createInsertSchema(friendGroups);

export type FriendGroup = typeof friendGroups.$inferSelect;
export type InsertFriendGroup = z.infer<typeof insertFriendGroupSchema>;

// 好友分組成員關聯表
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
  category: varchar("category").default("general"), // greeting, promotion, follow_up, etc
  language: varchar("language").default("zh-TW"),
  isActive: boolean("is_active").default(true),
  usageCount: integer("usage_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates);

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

// 群組消息
export const groupMessages = pgTable("group_messages", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => facebookAccounts.id),
  groupId: integer("group_id").references(() => friendGroups.id),
  templateId: integer("template_id").references(() => messageTemplates.id),
  messageContent: text("message_content").notNull(),
  scheduledAt: timestamp("scheduled_at"),
  sentAt: timestamp("sent_at"),
  status: varchar("status").default("pending"), // pending, sent, failed
  recipientCount: integer("recipient_count").default(0),
  successCount: integer("success_count").default(0),
  failureCount: integer("failure_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGroupMessageSchema = createInsertSchema(groupMessages);

export type GroupMessage = typeof groupMessages.$inferSelect;
export type InsertGroupMessage = z.infer<typeof insertGroupMessageSchema>;

// 自動回覆規則
export const autoReplyRules = pgTable("auto_reply_rules", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => facebookAccounts.id),
  ruleName: varchar("rule_name").notNull(),
  keywords: text("keywords").notNull(), // JSON array of keywords
  replyTemplate: text("reply_template").notNull(),
  isActive: boolean("is_active").default(true),
  priority: integer("priority").default(1),
  cooldownMinutes: integer("cooldown_minutes").default(60),
  maxRepliesPerDay: integer("max_replies_per_day").default(10),
  usageCount: integer("usage_count").default(0),
  lastUsed: timestamp("last_used"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertAutoReplyRuleSchema = createInsertSchema(autoReplyRules);

export type AutoReplyRule = typeof autoReplyRules.$inferSelect;
export type InsertAutoReplyRule = z.infer<typeof insertAutoReplyRuleSchema>;

// 翻譯記錄
export const translations = pgTable("translations", {
  id: serial("id").primaryKey(),
  originalText: text("original_text").notNull(),
  translatedText: text("translated_text").notNull(),
  sourceLanguage: varchar("source_language").notNull(),
  targetLanguage: varchar("target_language").notNull(),
  usageCount: integer("usage_count").default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTranslationSchema = createInsertSchema(translations);

export type Translation = typeof translations.$inferSelect;
export type InsertTranslation = z.infer<typeof insertTranslationSchema>;

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

export const facebookGenerationTasksRelations = relations(facebookGenerationTasks, ({ many }) => ({
  accounts: many(facebookAccounts),
}));

export const facebookAccountsRelations = relations(facebookAccounts, ({ one, many }) => ({
  generationTask: one(facebookGenerationTasks, {
    fields: [facebookAccounts.generationTaskId],
    references: [facebookGenerationTasks.id],
  }),
  friends: many(facebookFriends),
  friendGroups: many(friendGroups),
  groupMessages: many(groupMessages),
  autoReplyRules: many(autoReplyRules),
}));

export const facebookFriendsRelations = relations(facebookFriends, ({ one }) => ({
  account: one(facebookAccounts, {
    fields: [facebookFriends.accountId],
    references: [facebookAccounts.id],
  }),
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

// 手動廣告數據管理
export const manualAdData = pgTable("manual_ad_data", {
  id: serial("id").primaryKey(),
  campaignName: varchar("campaign_name").notNull(),
  date: varchar("date").notNull(),
  spend: integer("spend").notNull(), // 存儲為分（cents）避免浮點數問題
  impressions: integer("impressions").notNull(),
  clicks: integer("clicks").notNull(),
  conversions: integer("conversions").notNull(),
  audience: jsonb("audience").notNull(), // 存儲受眾數據
  placements: jsonb("placements").notNull(), // 版面選擇
  publishRegions: jsonb("publish_regions").notNull(), // 發布地區
  adObjective: varchar("ad_objective").notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertManualAdDataSchema = createInsertSchema(manualAdData);

export type ManualAdData = typeof manualAdData.$inferSelect;
export type InsertManualAdData = z.infer<typeof insertManualAdDataSchema>;