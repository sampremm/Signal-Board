# Deployment Guide

Signal Board uses a two-project Vercel deployment backed by Neon PostgreSQL and GitHub Actions for CI.

- **Frontend:** https://signal-board-delta.vercel.app
- **Backend API:** https://signal-board-eb7y.vercel.app
- **Repository:** https://github.com/sampremm/Signal-Board

---

## 1. Prerequisites

- [Node.js 20+](https://nodejs.org)
- [Vercel account](https://vercel.com) with two projects created:
  - One for the `client/` directory (frontend)
  - One for the `server/` directory (backend)
- [Neon](https://neon.tech) PostgreSQL database (free tier works)
- Optionally: [Upstash Redis](https://upstash.com), [Groq API key](https://console.groq.com), [Gemini API key](https://aistudio.google.com), [SerpAPI key](https://serpapi.com)

---

## 2. Clone & Install

```bash
git clone https://github.com/sampremm/Signal-Board.git
cd Signal-Board

# Backend
cd server && npm install

# Frontend
cd ../client && npm install
```

---

## 3. Environment Variables

### Backend (`server/.env`)

Create `server/.env` using the template below (copy from `.env.example`):

```ini
NODE_ENV=development
PORT=5001

# Neon PostgreSQL — REQUIRED
# Use the pooled URL for the app, direct URL for Prisma migrations
DATABASE_URL="postgresql://user:pass@ep-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-direct.us-east-1.aws.neon.tech/neondb?sslmode=require"

# Auth — REQUIRED
JWT_SECRET="your-long-random-secret"

# Redis — OPTIONAL (rate limiting and AI query cache)
# Option A: standard TCP (local Redis, Redis Cloud)
REDIS_URL="redis://default:password@host:port"
# Option B: Upstash REST (recommended for Vercel serverless)
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_token"

# AI Providers — OPTIONAL (system falls back gracefully if absent)
GEMINI_API_KEY="AIzaSy..."
GROQ_API_KEY="gsk_..."
SERPAPI_API_KEY="your_serpapi_key"
```

### Frontend

Set in your Vercel frontend project Settings → Environment Variables:

```ini
# The backend API base URL — must point to your deployed backend
VITE_API_URL=https://signal-board-eb7y.vercel.app
```

> The frontend code normalizes this URL and automatically appends `/api` if missing, so both `https://signal-board-eb7y.vercel.app` and `https://signal-board-eb7y.vercel.app/api` work correctly.

---

## 4. Database Setup

Run Prisma migrations against your Neon database:

```bash
cd server

# Push schema (creates tables)
npx prisma db push

# Generate Prisma client
npx prisma generate
```

---

## 5. Run Locally

Start both servers in separate terminals:

```bash
# Terminal 1 — Backend (http://localhost:5001)
cd server
npm run dev

# Terminal 2 — Frontend (http://localhost:5173, proxied to :5001)
cd client
npm run dev
```

The Vite dev server proxies all `/api/*` requests to `http://localhost:5001` via `vite.config.js`.

Verify the backend is running:
```bash
curl http://localhost:5001/api/health
```

---

## 6. Vercel Deployment

Signal Board uses **Vercel GitHub Integration** — pushing to `main` triggers automatic deployments on both projects. No manual CLI steps are required.

### Backend project settings

| Setting | Value |
| :--- | :--- |
| Root Directory | `server` |
| Build Command | `npm run build` (runs `prisma generate`) |
| Output Directory | *(leave blank — serverless functions)* |
| Install Command | `npm install` |
| Node.js Version | 20.x |

Configure all backend environment variables in **Settings → Environment Variables** on the Vercel dashboard. Without `DATABASE_URL` and `JWT_SECRET`, the server will log warnings and auth/db routes will fail.

### Frontend project settings

| Setting | Value |
| :--- | :--- |
| Root Directory | `client` |
| Build Command | `npm run build` |
| Output Directory | `dist` |
| Install Command | `npm install` |
| Node.js Version | 20.x |

Set `VITE_API_URL` to your backend's Vercel URL.  
**Important:** `VITE_*` variables are baked into the bundle at build time. After changing them, you must trigger a new deployment.

### CORS

The backend allows requests from these origins (hardcoded in `server/src/index.js`):

```
http://localhost:5173
http://localhost:3000
http://127.0.0.1:5173
https://signal-board-delta.vercel.app
```

If your frontend is deployed at a different URL, add it to the `cors()` configuration.

---

## 7. CI/CD Pipeline (GitHub Actions)

File: `.github/workflows/vercel.yml`

Triggers on every push to `main` or `develop` and on pull requests.

```
Backend CI Job
  ├── actions/checkout@v4
  ├── actions/setup-node@v4 (Node 20)
  ├── npm ci
  ├── npx prisma validate   ← uses mock DATABASE_URL/DIRECT_URL
  └── npm run build         ← runs prisma generate

Frontend CI Job
  ├── actions/checkout@v4
  ├── actions/setup-node@v4 (Node 20)
  ├── npm ci
  └── npm run build         ← Vite production build
```

After both jobs pass, Vercel's GitHub Integration automatically deploys both projects. There is no separate deploy job in the workflow — Vercel handles it via its GitHub App connection.

---

## 8. Vercel Configuration (`vercel.json`)

The root `vercel.json` routes all requests under `/api/*` to the backend serverless function:

```json
{
  "rewrites": [{ "source": "/api/(.*)", "destination": "/src/index.js" }]
}
```

This is present in the `server/` directory. The frontend (`client/`) is a static Vite build with no server-side rewrites needed.

---

## 9. Production Checklist

- [ ] `DATABASE_URL` and `DIRECT_URL` set in Vercel backend project
- [ ] `JWT_SECRET` set in Vercel backend project
- [ ] `VITE_API_URL` set in Vercel frontend project
- [ ] Neon database schema pushed (`prisma db push`)
- [ ] Backend health endpoint returns 200: `GET /api/health`
- [ ] Frontend login works with demo credentials
- [ ] CORS allows your frontend's production domain
