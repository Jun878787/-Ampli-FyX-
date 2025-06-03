import { db } from "./db";
import { 
  collectionTasks, 
  collectedData, 
  systemStats,
  facebookAccounts,
  facebookFriends,
  friendGroups,
  messageTemplates,
  autoReplyRules
} from "@shared/schema";

async function seedDatabase() {
  console.log("🌱 Seeding database...");

  try {
    // Insert initial system stats
    await db.insert(systemStats).values({
      totalCollected: 0,
      activeTasks: 0,
      successRate: "0",
      todayCollected: 0,
      cpuUsage: "25%",
      memoryUsage: "1.2 GB",
      networkStatus: "good",
    });

    // Insert sample collection tasks
    const tasks = await db.insert(collectionTasks).values([
      {
        name: "North™Sea 日常貼文收集",
        type: "posts",
        status: "running",
        targetCount: 1000,
        keywords: "北金國際, North Sea, 技術, 創新",
        timeRange: 7,
        includeImages: true,
        includeVideos: false,
        progress: 67,
      },
      {
        name: "社交媒體評論分析",
        type: "comments", 
        status: "running",
        targetCount: 500,
        keywords: "反饋, 評價, 客戶意見",
        timeRange: 3,
        includeImages: false,
        includeVideos: false,
        progress: 23,
      },
      {
        name: "用戶資料採集",
        type: "profiles",
        status: "pending",
        targetCount: 200,
        keywords: "企業客戶, 潛在用戶",
        timeRange: 14,
        includeImages: true,
        includeVideos: true,
        progress: 0,
      }
    ]).returning();

    // Insert sample collected data
    await db.insert(collectedData).values([
      {
        taskId: tasks[0].id,
        type: "post",
        content: "北金國際North™Sea致力於提供最先進的數據採集解決方案，幫助企業更好地理解市場動態和客戶需求。",
        author: { name: "北金國際官方", followers: "25.8K", avatar: "N" },
        publishTime: new Date("2024-06-03T14:32:00"),
        interactions: { likes: 245, comments: 38, shares: 12 },
        status: "collected",
        metadata: { hasImage: true, category: "企業動態" },
      },
      {
        taskId: tasks[0].id,
        type: "post", 
        content: "今天參加了數據科學會議，分享了North™Sea在Facebook數據採集領域的最新技術突破。",
        author: { name: "技術總監 李明", followers: "12.3K", avatar: "L" },
        publishTime: new Date("2024-06-03T13:15:00"),
        interactions: { likes: 156, comments: 24, shares: 8 },
        status: "processing",
        metadata: { category: "技術分享", tags: ["數據科學", "AI", "創新"] },
      },
      {
        taskId: tasks[0].id,
        type: "post",
        content: "North™Sea數據採集系統正式上線！為企業提供專業的Facebook數據收集和分析服務。",
        author: { name: "產品經理 張華", followers: "18.7K", avatar: "Z" },
        publishTime: new Date("2024-06-03T11:45:00"),
        interactions: { likes: 312, comments: 45, shares: 18 },
        status: "collected",
        metadata: { hasImage: true, category: "產品發布" },
      },
      {
        taskId: tasks[1].id,
        type: "comment",
        content: "North™Sea的數據採集功能非常強大，幫助我們公司節省了大量時間！",
        author: { name: "企業用戶 王總", followers: "5.2K", avatar: "W" },
        publishTime: new Date("2024-06-03T10:30:00"),
        interactions: { likes: 89, comments: 12, shares: 3 },
        status: "collected",
        metadata: { sentiment: "positive", category: "客戶反饋" },
      },
      {
        taskId: tasks[1].id,
        type: "comment",
        content: "期待看到更多North™Sea在數據分析領域的創新產品。",
        author: { name: "行業分析師 陳博士", followers: "15.9K", avatar: "C" },
        publishTime: new Date("2024-06-03T09:15:00"),
        interactions: { likes: 134, comments: 8, shares: 5 },
        status: "collected",
        metadata: { sentiment: "positive", category: "行業評論" },
      }
    ]);

    // Insert sample Facebook accounts
    const accounts = await db.insert(facebookAccounts).values([
      {
        accountName: "北金國際主帳號",
        email: "main@northsea.com",
        userId: "fb_main_001",
        status: "active",
        friendsCount: 1250,
        lastLogin: new Date("2024-06-03T08:30:00"),
      },
      {
        accountName: "North™Sea 營銷帳號",
        email: "marketing@northsea.com", 
        userId: "fb_marketing_002",
        status: "active",
        friendsCount: 890,
        lastLogin: new Date("2024-06-03T07:15:00"),
      },
      {
        accountName: "技術支援帳號",
        email: "support@northsea.com",
        userId: "fb_support_003", 
        status: "inactive",
        friendsCount: 456,
        lastLogin: new Date("2024-06-02T16:45:00"),
      }
    ]).returning();

    // Insert sample Facebook friends
    await db.insert(facebookFriends).values([
      {
        accountId: accounts[0].id,
        friendId: "fb_friend_001",
        friendName: "台灣數據科技公司",
        location: "台北",
        school: "台灣大學",
        workplace: "數據科技有限公司",
        mutualFriends: 25,
        status: "accepted",
      },
      {
        accountId: accounts[0].id,
        friendId: "fb_friend_002", 
        friendName: "張經理",
        location: "新竹",
        school: "清華大學",
        workplace: "科技園區",
        mutualFriends: 18,
        status: "accepted",
      },
      {
        accountId: accounts[1].id,
        friendId: "fb_friend_003",
        friendName: "李總監",
        location: "台中",
        school: "中興大學", 
        workplace: "營銷顧問公司",
        mutualFriends: 32,
        status: "pending",
      },
      {
        accountId: accounts[1].id,
        friendId: "fb_friend_004",
        friendName: "王副總",
        location: "高雄",
        school: "成功大學",
        workplace: "南部科技公司",
        mutualFriends: 14,
        status: "accepted",
      }
    ]);

    // Insert sample friend groups
    const groups = await db.insert(friendGroups).values([
      {
        accountId: accounts[0].id,
        groupName: "企業客戶",
        description: "重要的企業級客戶聯絡人",
        color: "#3b82f6",
      },
      {
        accountId: accounts[0].id,
        groupName: "技術夥伴",
        description: "技術合作夥伴和開發者",
        color: "#10b981",
      },
      {
        accountId: accounts[1].id,
        groupName: "營銷聯絡人",
        description: "營銷和推廣相關聯絡人",
        color: "#f59e0b",
      }
    ]).returning();

    // Insert sample message templates
    await db.insert(messageTemplates).values([
      {
        name: "歡迎訊息",
        content: "歡迎加入北金國際North™Sea！我們很高興能為您提供專業的數據採集服務。",
        type: "text",
        isActive: true,
      },
      {
        name: "產品介紹",
        content: "North™Sea提供全方位的Facebook數據採集解決方案，幫助企業做出更明智的決策。",
        type: "text", 
        isActive: true,
      },
      {
        name: "技術支援",
        content: "如果您在使用過程中遇到任何技術問題，請隨時聯繫我們的技術支援團隊。",
        type: "text",
        isActive: true,
      }
    ]);

    // Insert sample auto reply rules
    await db.insert(autoReplyRules).values([
      {
        accountId: accounts[0].id,
        ruleName: "問候回覆",
        keywords: ["你好", "哈囉", "嗨", "hello"],
        replyContent: "您好！感謝您聯繫北金國際North™Sea。我們會盡快回覆您的訊息。",
        isActive: true,
        priority: 1,
        maxRepliesPerDay: 50,
      },
      {
        accountId: accounts[0].id,
        ruleName: "產品諮詢",
        keywords: ["產品", "服務", "價格", "方案"],
        replyContent: "感謝您對我們產品的興趣！我們的專業顧問會在工作時間內與您聯繫，為您提供詳細的產品介紹。",
        isActive: true,
        priority: 2,
        maxRepliesPerDay: 30,
      },
      {
        accountId: accounts[1].id,
        ruleName: "營銷活動",
        keywords: ["活動", "優惠", "促銷"],
        replyContent: "我們目前有精彩的營銷活動正在進行中！請查看我們的最新動態了解更多詳情。",
        isActive: true,
        priority: 1,
        maxRepliesPerDay: 100,
      }
    ]);

    // Update system stats with seeded data
    await db.update(systemStats).set({
      totalCollected: 5,
      activeTasks: 2,
      successRate: "94.2",
      todayCollected: 5,
    });

    console.log("✅ Database seeded successfully!");
    console.log(`📊 Created ${tasks.length} collection tasks`);
    console.log("📝 Created 5 sample data entries");
    console.log("📈 Updated system statistics");

  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding when this file is executed directly
seedDatabase()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));

export { seedDatabase };