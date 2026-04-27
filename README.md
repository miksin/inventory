# Family Inventory（家庭庫存管理）

供 1–5 人家庭共用的個人物品庫存管理 Web App，部署於 Cloudflare 全家桶。

## Tech Stack

- **Frontend:** SvelteKit + TypeScript + TailwindCSS
- **Backend:** SvelteKit API Routes → Cloudflare Workers
- **Database:** Cloudflare D1（SQLite-compatible）
- **Session / Cache:** Cloudflare KV
- **Deployment:** Cloudflare Pages + Workers

## 功能特色

- Magic Link 登入（無需密碼）
- 物品管理：新增、編輯、刪除，含數量、位置、到期日
- 自訂分類（廚房、浴室、倉庫等）
- 首頁 Dashboard：即將到期 / 低庫存提醒
- 家庭協作：多成員共用清單，操作紀錄可查

## 本地開發

### 前置需求

- Node.js 20+
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/)（`npm i -g wrangler`）

### 安裝

```bash
npm install
```

### 建立本地 D1 資料庫

```bash
wrangler d1 execute inventory-db --local --file=migrations/001_init.sql
```

### 啟動開發伺服器

```bash
npm run dev
```

前往 `http://localhost:5173`。

### 執行測試

```bash
npm test
```

### 型別檢查

```bash
npm run check
```

## 部署

1. 在 [Cloudflare Dashboard](https://dash.cloudflare.com) 建立 D1 database `inventory-db` 與 KV namespaces `SESSIONS`、`CACHE`
2. 更新 `wrangler.toml` 填入正確的 database_id 與 KV namespace IDs
3. 部署：

```bash
npm run build
wrangler pages deploy .svelte-kit/cloudflare
```

## 環境變數

| 變數 | 說明 |
|------|------|
| `RESEND_API_KEY` | Resend API 金鑰（Magic Link 信件） |
| `INVITE_CODE` | 邀請碼 |
| `APP_URL` | App 公開 URL（用於 Magic Link） |

在 Cloudflare Pages 的 Settings → Environment Variables 設定。

## 授權

Private project — All rights reserved.
