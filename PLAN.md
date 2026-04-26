# 家庭庫存管理系統 (Family Inventory) — Design & Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task.

**Goal:** 打造一個供 1–5 人家庭共用的個人物品庫存管理 Web App，部署於 Cloudflare 全家桶。

**Architecture:** SvelteKit 作為前端框架，Cloudflare Workers 處理 API，D1 儲存主要資料，KV 存放 session 與快取。前後端整合在同一個 SvelteKit 專案，透過 SvelteKit server routes 對應 Cloudflare Workers。

**Tech Stack:**
- Frontend: SvelteKit + TypeScript + TailwindCSS
- Backend: SvelteKit API Routes → Cloudflare Workers (via `@sveltejs/adapter-cloudflare`)
- Database: Cloudflare D1 (SQLite-compatible)
- Session/Cache: Cloudflare KV
- File Storage: Cloudflare R2 (Phase 2，MVP 暫緩)
- Auth: Email Magic Link（透過 Resend）
- Deployment: Cloudflare Pages + Workers

---

## 專案概覽

### 核心功能（MVP）

1. **Auth** — 邀請碼 + Magic Link 登入，無需記密碼
2. **物品管理** — 新增、編輯、刪除物品，含數量、位置、到期日
3. **分類管理** — 自訂分類（廚房/浴室/倉庫等）
4. **即將到期提醒** — 首頁顯示近 30 天到期物品
5. **低庫存提醒** — 首頁顯示數量低於設定值的物品
6. **協作** — 家庭成員共用同一份清單，可看到誰做了什麼更動

### 超出 MVP 範圍（Phase 2）

- 條碼掃描
- Push / Email 通知
- PWA 離線支援
- 圖片上傳（R2）
- 統計報表

---

## 資料庫 Schema（D1）

```sql
-- 家庭群組
CREATE TABLE households (
  id TEXT PRIMARY KEY,          -- nanoid
  name TEXT NOT NULL,
  invite_code TEXT UNIQUE,      -- 6 碼邀請碼
  created_at INTEGER NOT NULL   -- Unix timestamp
);

-- 成員
CREATE TABLE members (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  email TEXT NOT NULL,
  display_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'member', -- 'owner' | 'member'
  created_at INTEGER NOT NULL
);

-- 物品分類
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  name TEXT NOT NULL,
  icon TEXT,        -- emoji
  color TEXT,       -- hex color
  sort_order INTEGER DEFAULT 0
);

-- 物品（核心資料表）
CREATE TABLE items (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  category_id TEXT REFERENCES categories(id),
  name TEXT NOT NULL,
  description TEXT,
  quantity REAL NOT NULL DEFAULT 1,
  unit TEXT DEFAULT '個',
  low_stock_threshold REAL,     -- 低於此值顯示警示
  location TEXT,                -- 存放位置
  purchase_date INTEGER,        -- Unix timestamp
  expiry_date INTEGER,          -- Unix timestamp，食品/藥品
  warranty_until INTEGER,       -- Unix timestamp，電器保固
  barcode TEXT,
  tags TEXT DEFAULT '[]',       -- JSON array of strings
  added_by TEXT REFERENCES members(id),
  updated_by TEXT REFERENCES members(id),
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- 操作紀錄
CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  household_id TEXT NOT NULL REFERENCES households(id),
  member_id TEXT REFERENCES members(id),
  action TEXT NOT NULL,         -- 'create' | 'update' | 'delete'
  item_id TEXT,
  item_name TEXT,               -- 快照，避免刪除後查不到
  diff TEXT,                    -- JSON，記錄變更前後的欄位
  created_at INTEGER NOT NULL
);

-- Magic Link tokens
CREATE TABLE magic_links (
  token TEXT PRIMARY KEY,
  email TEXT NOT NULL,
  household_id TEXT,            -- 若為邀請流程則帶入
  expires_at INTEGER NOT NULL,
  used_at INTEGER
);
```

---

## KV 命名空間使用規劃

| Binding | Key Pattern | 用途 | TTL |
|---|---|---|---|
| `SESSIONS` | `session:{token}` | 登入 session（member_id + household_id） | 7 天 |
| `CACHE` | `household:{id}:stats` | 首頁統計快取 | 5 分鐘 |
| `CACHE` | `invite:{code}` | 邀請碼快取（D1 的補充） | 24 小時 |

---

## 頁面結構

```
/                       → 首頁（需登入）：警示區塊 + 最近活動
/login                  → 登入頁（輸入 Email）
/login/verify           → Magic Link 驗證（?token=xxx）
/setup                  → 建立新家庭（首次使用）
/join                   → 加入家庭（輸入邀請碼）
/items                  → 物品清單（搜尋 / 篩選）
/items/new              → 新增物品
/items/[id]             → 物品詳情
/items/[id]/edit        → 編輯物品
/categories             → 分類管理
/household              → 家庭設定（成員、邀請碼）
/activity               → 操作紀錄
```

---

## API Routes（SvelteKit Server Routes）

```
POST   /api/auth/magic-link          → 送出 magic link email
GET    /api/auth/verify?token=       → 驗證 token，建立 session
POST   /api/auth/logout              → 清除 session

GET    /api/items                    → 列出物品（支援 ?category=&location=&q=）
POST   /api/items                    → 新增物品
GET    /api/items/[id]               → 取得單一物品
PUT    /api/items/[id]               → 更新物品
DELETE /api/items/[id]               → 刪除物品

GET    /api/categories               → 列出分類
POST   /api/categories               → 新增分類
PUT    /api/categories/[id]          → 更新分類
DELETE /api/categories/[id]          → 刪除分類

GET    /api/dashboard                → 首頁資料（警示 + 統計）
GET    /api/activity                 → 操作紀錄

POST   /api/household                → 建立家庭
GET    /api/household                → 取得家庭資訊
POST   /api/household/invite         → 重新產生邀請碼
POST   /api/household/join           → 加入家庭（邀請碼）
DELETE /api/household/members/[id]   → 移除成員（僅 owner）
```

---

## 實作任務清單

### Phase 0：專案初始化

#### Task 0.1：建立 SvelteKit 專案
- `npm create svelte@latest . -- --template skeleton --types typescript`
- 安裝依賴：`@sveltejs/adapter-cloudflare`, `tailwindcss`, `@tailwindcss/vite`, `nanoid`, `wrangler`
- 設定 `svelte.config.js` 使用 `adapter-cloudflare`
- 設定 `tailwind.config.ts`

#### Task 0.2：設定 Wrangler（Cloudflare 本機開發）
- 建立 `wrangler.toml`，設定 D1 binding (`DB`) 與 KV namespace (`SESSIONS`, `CACHE`)
- 建立 `src/app.d.ts`，擴充 `App.Locals`（含 `session`, `db`, `kv`）
- 建立 `.dev.vars` (gitignore)，放本機開發用的 env（`RESEND_API_KEY` 等）

#### Task 0.3：D1 Migration 初始化
- 建立 `migrations/0001_init.sql`，貼入上方 Schema
- 執行 `wrangler d1 execute DB --local --file migrations/0001_init.sql`

---

### Phase 1：Auth 系統

#### Task 1.1：Magic Link 送信
- 建立 `src/routes/api/auth/magic-link/+server.ts`
- 呼叫 Resend API 發送 magic link email（含 token）
- token 寫入 D1 `magic_links` table，有效期 15 分鐘

#### Task 1.2：Magic Link 驗證 + Session 建立
- 建立 `src/routes/api/auth/verify/+server.ts`
- 驗證 token 是否有效、未使用、未過期
- 建立 session，寫入 KV（`session:{nanoid()}`），TTL 7 天
- 設定 HttpOnly cookie `session_token`，redirect 到首頁

#### Task 1.3：Auth Middleware（`hooks.server.ts`）
- 建立 `src/hooks.server.ts`
- 每個 request 解析 `session_token` cookie → KV → 取得 member + household
- 寫入 `event.locals.session`
- 未登入且非 `/login` 路由 → redirect `/login`

#### Task 1.4：登入頁面
- 建立 `src/routes/login/+page.svelte`（輸入 Email 的表單）
- 建立 `src/routes/login/+page.server.ts`（form action 呼叫 magic-link API）
- 建立 `src/routes/login/verify/+page.server.ts`（load function 解析 token）

---

### Phase 2：家庭群組

#### Task 2.1：建立家庭
- `src/routes/setup/+page.svelte` + `+page.server.ts`
- 建立 household + 第一位 owner member
- 產生 6 碼邀請碼（uppercase alphanumeric）

#### Task 2.2：加入家庭
- `src/routes/join/+page.svelte` + `+page.server.ts`
- 輸入邀請碼 → 查詢 D1 → 建立 member → 加入 session

#### Task 2.3：家庭設定頁
- `src/routes/household/+page.svelte`
- 顯示成員列表、邀請碼（可複製）、重新產生邀請碼
- Owner 可移除成員

---

### Phase 3：分類管理

#### Task 3.1：分類 CRUD API
- `src/routes/api/categories/+server.ts`（GET, POST）
- `src/routes/api/categories/[id]/+server.ts`（PUT, DELETE）

#### Task 3.2：分類管理頁面
- `src/routes/categories/+page.svelte`
- 列出分類（含 icon/color）
- 新增、編輯（inline）、刪除分類

---

### Phase 4：物品 CRUD

#### Task 4.1：物品列表 API
- `src/routes/api/items/+server.ts`（GET with 篩選, POST）
- 支援 query params：`?category=&location=&q=&sort=expiry`

#### Task 4.2：物品 CRUD API
- `src/routes/api/items/[id]/+server.ts`（GET, PUT, DELETE）
- DELETE 時寫入 activity_log
- PUT 時計算 diff 並寫入 activity_log

#### Task 4.3：物品清單頁面
- `src/routes/items/+page.svelte`
- 搜尋列 + 分類篩選 + 位置篩選
- 物品卡片：名稱、數量、分類、到期日（近期醒目標示）

#### Task 4.4：新增物品表單
- `src/routes/items/new/+page.svelte` + `+page.server.ts`
- 表單欄位：名稱、分類、數量、單位、位置、到期日、保固日、說明、tags
- 送出後 redirect `/items`

#### Task 4.5：物品詳情頁
- `src/routes/items/[id]/+page.svelte`
- 顯示所有欄位 + 操作紀錄（該物品的 activity_log）
- 編輯 / 刪除按鈕

#### Task 4.6：編輯物品表單
- `src/routes/items/[id]/edit/+page.svelte` + `+page.server.ts`
- 預填現有資料，PUT 更新

---

### Phase 5：首頁 Dashboard

#### Task 5.1：Dashboard API
- `src/routes/api/dashboard/+server.ts`
- 回傳：
  - `expiring_soon`：expiry_date 在未來 30 天內的物品
  - `low_stock`：quantity <= low_stock_threshold 的物品
  - `recent_activity`：最近 10 筆 activity_log

#### Task 5.2：首頁
- `src/routes/+page.svelte`
- 3 個警示區塊：即將到期 / 低庫存 / 最近活動
- 每個區塊點擊可展開詳細列表

---

### Phase 6：操作紀錄

#### Task 6.1：Activity Log 頁面
- `src/routes/activity/+page.svelte`
- 列出所有操作，含成員名稱、動作類型、時間
- 支援分頁（每頁 20 筆）

---

### Phase 7：部署

#### Task 7.1：Cloudflare D1 Production 設定
- `wrangler d1 create family-inventory`
- 更新 `wrangler.toml` 加入 production database_id
- `wrangler d1 execute DB --file migrations/0001_init.sql`

#### Task 7.2：Cloudflare KV Production 設定
- `wrangler kv namespace create SESSIONS`
- `wrangler kv namespace create CACHE`
- 更新 `wrangler.toml`

#### Task 7.3：環境變數設定
- `wrangler secret put RESEND_API_KEY`
- `wrangler secret put SESSION_SECRET`

#### Task 7.4：部署至 Cloudflare Pages
- `wrangler pages project create family-inventory`
- 設定 GitHub Actions CI/CD（`wrangler pages deploy`）
- 確認 custom domain / `pages.dev` URL

---

## 目錄結構（預期）

```
inventory/
├── migrations/
│   └── 0001_init.sql
├── src/
│   ├── app.d.ts              # TypeScript types for App.Locals
│   ├── app.html
│   ├── hooks.server.ts       # Auth middleware
│   ├── lib/
│   │   ├── server/
│   │   │   ├── db.ts         # D1 query helpers
│   │   │   ├── auth.ts       # Session/magic link helpers
│   │   │   └── activity.ts   # Activity log helpers
│   │   ├── components/
│   │   │   ├── ItemCard.svelte
│   │   │   ├── AlertBlock.svelte
│   │   │   └── ...
│   │   └── utils.ts          # nanoid, date formatting, etc.
│   └── routes/
│       ├── +layout.svelte
│       ├── +layout.server.ts
│       ├── +page.svelte      # Dashboard
│       ├── login/
│       ├── setup/
│       ├── join/
│       ├── items/
│       ├── categories/
│       ├── household/
│       ├── activity/
│       └── api/
│           ├── auth/
│           ├── items/
│           ├── categories/
│           ├── dashboard/
│           ├── activity/
│           └── household/
├── static/
├── wrangler.toml
├── package.json
├── svelte.config.js
├── tailwind.config.ts
├── tsconfig.json
└── PLAN.md
```

---

## UI 設計原則

- **Mobile-first**：主要使用情境是手機站在廚房前查庫存
- **快速操作**：新增物品的步驟越少越好（name + quantity 是唯一必填）
- **視覺警示**：到期日 < 7 天 → 紅色；< 30 天 → 橙色；低庫存 → 黃色
- **深色/淺色模式**：跟隨系統設定（TailwindCSS `dark:` prefix）

---

## 環境變數

| 變數名 | 說明 | 來源 |
|---|---|---|
| `RESEND_API_KEY` | Resend Email API Key | Cloudflare Secret |
| `SESSION_SECRET` | Cookie 簽名用的 secret | Cloudflare Secret |
| `APP_URL` | 部署的 URL（magic link 用） | Cloudflare Pages env |

---

## 開發指令

```bash
# 安裝依賴
npm install

# 本機開發（含 D1/KV 模擬）
npm run dev
# 或使用 wrangler
npx wrangler pages dev .svelte-kit/cloudflare

# D1 migration
npx wrangler d1 execute DB --local --file migrations/0001_init.sql

# 部署
npx wrangler pages deploy .svelte-kit/cloudflare
```
