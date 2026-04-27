# Family Inventory

A household inventory management app built with SvelteKit + Cloudflare Workers, deployed on Cloudflare Pages with D1 (SQLite) as the database.

## Tech Stack

- **Framework:** SvelteKit 2 + Svelte 4
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Build tool:** Vite 5
- **Testing:** Vitest
- **Deployment:** Cloudflare Pages + Workers (adapter-cloudflare)
- **Database:** Cloudflare D1 (SQLite)

## Local Development

### Prerequisites

- Node.js >= 18
- npm
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)
- Cloudflare account (for D1 access)

### Setup

```bash
npm install
```

### Run dev server (with local D1)

```bash
npm run dev
```

Visit [http://localhost:5173](http://localhost:5173)

> Wrangler proxies local D1 bindings automatically when using `adapter-cloudflare`.

### Type check

```bash
npm run check
```

### Run tests

```bash
npm test
```

## Build

```bash
npm run build
```

## Deployment (Cloudflare Pages)

| Setting | Value |
|---|---|
| Build command | `npm run build` |
| Build output directory | `.svelte-kit/cloudflare` |
| Node.js version | 18 |

### D1 Database binding

In the Cloudflare Pages dashboard, add a D1 database binding under **Settings > Functions > D1 database bindings**.

| Variable name | D1 database |
|---|---|
| `DB` | your-d1-database-name |
