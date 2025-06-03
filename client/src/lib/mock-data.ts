export const mockFacebookPosts = [
  {
    id: 1,
    content: "今天的天氣真的很棒！和朋友們一起去了海邊，拍了很多美麗的照片。生活就是要這樣充滿陽光和快樂！",
    author: {
      name: "Alice Chen",
      followers: "12.5K",
      avatar: "A"
    },
    publishTime: "2024-01-15T14:32:00",
    interactions: {
      likes: 142,
      comments: 23,
      shares: 8
    },
    status: "collected",
    type: "post"
  },
  {
    id: 2,
    content: "剛剛參加了一場很棒的技術會議，學到了很多新的程式設計技巧。分享給大家一些實用的資源！",
    author: {
      name: "Bob Wang",
      followers: "8.2K",
      avatar: "B"
    },
    publishTime: "2024-01-15T13:15:00",
    interactions: {
      likes: 89,
      comments: 16,
      shares: 5
    },
    status: "processing",
    type: "post"
  },
  {
    id: 3,
    content: "週末和家人一起做了美味的料理，分享一些簡單易學的食譜給大家！",
    author: {
      name: "Carol Liu",
      followers: "15.7K",
      avatar: "C"
    },
    publishTime: "2024-01-15T11:45:00",
    interactions: {
      likes: 203,
      comments: 34,
      shares: 12
    },
    status: "collected",
    type: "post"
  }
];

export const mockSystemStats = {
  totalCollected: 12856,
  activeTasks: 8,
  successRate: "94.2",
  todayCollected: 1247,
  cpuUsage: "34%",
  memoryUsage: "2.1 GB",
  networkStatus: "good"
};

export const mockCollectionTasks = [
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
    createdAt: "2024-01-13T10:00:00",
    completedAt: null
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
    createdAt: "2024-01-14T15:30:00",
    completedAt: null
  }
];

export function generateMockPost() {
  const posts = [
    "分享今天的美好時光！",
    "學習新技術總是讓人興奮",
    "和朋友聚餐，享受美食",
    "工作中的小確幸",
    "週末放鬆的好方法",
    "旅行中發現的美麗風景",
    "讀了一本很棒的書",
    "運動後的滿足感",
    "家人團聚的溫馨時刻",
    "創意料理的製作過程"
  ];

  const authors = [
    { name: "David Lee", followers: "9.1K", avatar: "D" },
    { name: "Emma Wu", followers: "23.4K", avatar: "E" },
    { name: "Frank Chen", followers: "5.7K", avatar: "F" },
    { name: "Grace Lin", followers: "18.9K", avatar: "G" },
    { name: "Henry Zhang", followers: "11.3K", avatar: "H" }
  ];

  const randomPost = posts[Math.floor(Math.random() * posts.length)];
  const randomAuthor = authors[Math.floor(Math.random() * authors.length)];

  return {
    content: randomPost,
    author: randomAuthor,
    publishTime: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000),
    interactions: {
      likes: Math.floor(Math.random() * 200) + 10,
      comments: Math.floor(Math.random() * 50) + 1,
      shares: Math.floor(Math.random() * 20) + 1
    },
    status: Math.random() > 0.8 ? "processing" : "collected",
    type: "post"
  };
}
