# FbDataMiner - Facebook數據挖掘工具

這是一個用於收集和分析Facebook數據的工具，包括廣告、頁面和用戶數據。

## 功能特點

- Facebook API整合
- 自動令牌刷新
- 數據收集和分析
- 廣告管理
- 用戶界面

## 技術棧

- 前端：React, TypeScript, Tailwind CSS
- 後端：Node.js, Express
- 數據庫：PostgreSQL (通過Drizzle ORM)

## 在Railway上部署

### 前置條件

1. 一個Railway帳戶
2. 一個Facebook開發者帳戶和應用程式
3. PostgreSQL數據庫

### 部署步驟

1. Fork或克隆此儲存庫
2. 在Railway上創建一個新項目
3. 添加PostgreSQL數據庫服務
4. 設置環境變數（參見下方）
5. 部署應用

### 環境變數

在Railway的項目設置中，添加以下環境變數：

```
DATABASE_URL=postgresql://username:password@hostname:port/database
FACEBOOK_API_KEY=your_facebook_api_key
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
FACEBOOK_AD_ACCOUNT_ID=your_facebook_ad_account_id
NODE_ENV=production
PORT=8080
SESSION_SECRET=your_session_secret
```

## 本地開發

1. 克隆儲存庫
2. 安裝依賴：`npm install`
3. 創建`.env`文件（基於`.env.example`）
4. 運行開發服務器：`npm run dev`

## 數據庫遷移

使用Drizzle ORM進行數據庫遷移：

```
npm run db:push
```

## 授權

MIT