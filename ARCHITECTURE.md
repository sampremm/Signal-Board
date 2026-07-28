# Architecture Reference

**Live:** https://signal-board-delta.vercel.app  
**API:** https://signal-board-eb7y.vercel.app/api/health

---

## Overview

Signal Board is a monorepo with two independently deployable units:

- `client/` — React 18 SPA (Vite + Tailwind CSS v4), deployed as a static Vercel build
- `server/` — Node.js + Express REST API, deployed as Vercel serverless functions

The system is designed for **antifragility** — every optional dependency (AI providers, Redis, database) has a graceful fallback so the core product never crashes.

---

## System Diagram

```
┌────────────────────────────────────────────────────────────────┐
│               Vercel CDN — Frontend (signal-board-delta)       │
│         React 18 + Vite 5 + Tailwind CSS v4 SPA               │
│                                                                │
│  [Landing Page]  [AI Smart Search Feed]  [Employer AI Studio] │
│        ↕ Axios (single apiClient instance, JWT interceptor)    │
└──────────────────────────┬─────────────────────────────────────┘
                           │ HTTPS / JSON
                           │
┌──────────────────────────▼─────────────────────────────────────┐
│         Vercel Serverless Functions — Backend (signal-board-eb7y)│
│                   Express.js + Helmet + CORS                   │
│                                                                │
│  /api/health  /api/auth  /api/jobs  /api/search  /api/ai       │
│       │               │                    │                   │
│  Auth Middleware   Rate Limiter         AI Pipeline            │
│  (JWT / RBAC)     (Redis-backed)        Orchestrator           │
└────┬───────────────────┬────────────────────┬──────────────────┘
     │                   │                    │
     ▼                   ▼                    ▼
┌─────────┐      ┌───────────────┐    ┌──────────────────────┐
│  Neon   │      │ Upstash Redis │    │  AI Cascade           │
│Postgres │      │               │    │  1. Groq Llama-3      │
│ Prisma  │      │  Rate Limit   │    │  2. Gemini 2.0 Flash  │
│   ORM   │      │  AI Cache     │    │  3. Heuristic Parser  │
│  (Pool) │      │  Circuit Bkr  │    │  4. Local Template    │
└─────────┘      └───────────────┘    └──────────────────────┘
```

---

## Frontend Architecture (`client/`)

### Navigation

`App.jsx` manages an `activeTab` state (`'LANDING'` | `'SEARCH'` | `'GENERATE'`). There is no React Router. Navigation is tab-based state switching.

### Role-based UI

The `user` object from `localStorage` (`signal_board_user`) drives all conditional rendering:
- `user === null` → Guest view (search is public, auth prompt for apply/post)
- `user.role === 'CANDIDATE'` → Employer Studio tab and CTA are hidden; Apply button is visible
- `user.role === 'EMPLOYER'` → Apply button is hidden; Employer Studio is accessible; job feed filtered to own postings

### API Client (`client/src/services/api.js`)

A single Axios instance with:
- `baseURL` normalized to always end in `/api` (prevents `/auth/login` vs `/api/auth/login` mismatch)
- Request interceptor that injects `Authorization: Bearer <token>` from `localStorage`
- Response interceptor that normalizes all errors into `{ success, message, code, details }`
- `AbortSignal` support on `getJobs()` for proper cleanup on unmount

### Component Tree

```
App.jsx
├── Navbar.jsx           — Logo, search bar, tab navigation, auth buttons
├── LandingPage.jsx      — Hero section with CTAs
├── SmartJobSearch.jsx   — AI search + jobs feed (candidate view / employer view)
│   └── JobDetailModal.jsx — Job detail + apply form
├── AiJobGenerator.jsx   — Employer Studio (AI description + publish)
└── AuthModal.jsx        — Login / Register modal
```

---

## Backend Architecture (`server/`)

### Server Entry (`server/src/index.js`)

- Loads `dotenv`
- Registers global `uncaughtException` and `unhandledRejection` handlers
- Configures CORS to allow `http://localhost:5173` and `https://signal-board-delta.vercel.app`
- Mounts Express routes
- Only calls `app.listen()` in non-Vercel environments; Vercel invokes the exported `app` directly

### Route Structure

```
/api/health            — GET  — inline handler in index.js
/api/auth              — auth.routes.js
  POST  /register      — authController.register
  POST  /login         — authController.login
  GET   /me            — authController.getMe
/api/jobs              — jobs.routes.js
  GET   /              — jobsController.getJobs
  GET   /:id           — jobsController.getJobById
  POST  /              — authenticate + requireRole('EMPLOYER') → createJob
  POST  /:id/apply     — authenticate + requireRole('CANDIDATE') → applyToJob
/api/ai                — ai.routes.js
  POST  /generate-job  — rateLimitMiddleware → aiController.generateJob
/api/search            — search.routes.js
  POST  /ai-search     — rateLimitMiddleware → searchController.searchJobs
```

### Middleware

| Middleware | File | Purpose |
| :--- | :--- | :--- |
| `authenticate` | `auth.middleware.js` | Verifies JWT; sets `req.user`; 401 if missing |
| `requireRole(r)` | `auth.middleware.js` | Asserts `req.user.role === r`; 403 otherwise |
| `rateLimitMiddleware` | `ratelimit.middleware.js` | Redis sliding-window limiter; pass-through if Redis is unavailable |
| `errorHandler` | `error.middleware.js` | Catches all unhandled errors; returns `{ success: false, error }` |

### Services

| Service | File | Responsibility |
| :--- | :--- | :--- |
| Database | `db.service.js` | Prisma singleton via `Proxy` (lazy init); `withDbRetry()` helper |
| Cache | `redis.service.js` | Priority: `REDIS_URL` (TCP) → Upstash REST → in-process no-op |
| AI | `ai.service.js` | Gemini 2.0 Flash client with 8s timeout |

---

## Data Model

```prisma
enum UserRole          { EMPLOYER  CANDIDATE }
enum ApplicationStatus { SUBMITTED REVIEWING ACCEPTED REJECTED }

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String    // bcrypt hash, 10 rounds
  role      UserRole
  employer  Employer?
  candidate Candidate?
}

model Employer {
  id          String  @id @default(uuid())
  userId      String  @unique
  companyName String
  websiteUrl  String?
  description String?
  user        User    @relation(...)
  jobs        Job[]
}

model Candidate {
  id          String   @id @default(uuid())
  userId      String   @unique
  firstName   String
  lastName    String
  resumeText  String?
  skills      String[]
  user        User          @relation(...)
  applications Application[]
}

model Job {
  id          String   @id @default(uuid())
  employerId  String
  title       String
  description String
  location    String
  isRemote    Boolean  @default(false)
  salaryRange String?
  skills      String[]
  employer    Employer      @relation(...)
  applications Application[]
}

model Application {
  id          String            @id @default(uuid())
  jobId       String
  candidateId String
  status      ApplicationStatus @default(SUBMITTED)
  coverLetter String?
  appliedAt   DateTime          @default(now())
  @@unique([jobId, candidateId])  // prevents duplicate applications at DB level
}
```

**Why User is split from Employer/Candidate:** a single table with nullable role-specific columns forces every query to reason about which columns are valid for which role. Two narrow 1-to-1 tables eliminate that ambiguity at the cost of one extra join per profile read.

---

## AI Pipeline

### Smart Search cascade

```
POST /api/search/ai-search { query }
         │
         ▼
  shouldUseAI(query)?
  ├── word count > 6          → AI
  ├── contains intent phrase  → AI  ("recommend", "salary", "entry level", ...)
  └── short keyword           → heuristic (no AI, instant)
         │
         ▼ (if AI path)
  Redis cache hit?  → return cached result (TTL: 1 hour)
         │ miss
         ▼
  Groq  (llama-3.3-70b-versatile)
    ├── success → extract JSON params → DB query → cache → return
    └── fail
         ▼
  Gemini (gemini-2.0-flash-lite)
    ├── success → extract JSON params → DB query → cache → return
    └── fail
         ▼
  Heuristic regex parser (zero dependencies, always available)
    └── DB query → return
```

### Job description generation cascade

```
POST /api/ai/generate-job { title, companyName, rawNotes }
         │
         ▼
  Gemini (gemini-2.0-flash-lite, 8s timeout)
    ├── success → return formattedDescription
    └── fail
         ▼
  Groq (llama-3.3-70b-versatile, if GROQ_API_KEY set)
    ├── success → return formattedDescription
    └── fail
         ▼
  Local Markdown template (always available)
    └── return templated fallback
```

---

## Antifragile Fallback Strategy

| Dependency | What happens if it's unavailable |
| :--- | :--- |
| Neon PostgreSQL | Auth falls back to in-memory demo users; Jobs falls back to hardcoded seed list |
| Upstash Redis | Rate limiting and caching are skipped; all requests pass through |
| Groq | AI pipeline promotes to Gemini |
| Gemini | AI pipeline promotes to heuristic parser / local template |
| SerpAPI | Live job results are skipped; only DB results are returned |

---

## Folder Structure

```
Signal-Board/
├── .github/
│   └── workflows/
│       └── vercel.yml          ← CI pipeline (backend + frontend checks)
├── client/                     ← React SPA
│   ├── src/
│   │   ├── components/
│   │   │   ├── auth/           AuthModal.jsx
│   │   │   ├── candidate/      SmartJobSearch.jsx, JobDetailModal.jsx
│   │   │   ├── employer/       AiJobGenerator.jsx
│   │   │   └── common/         Navbar.jsx, ErrorBoundary.jsx
│   │   ├── pages/              LandingPage.jsx
│   │   ├── services/           api.js (Axios client)
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── vite.config.js          ← dev proxy: /api → localhost:5001
│   └── package.json
├── server/                     ← Express API
│   ├── src/
│   │   ├── controllers/        auth, jobs, ai, search
│   │   ├── middleware/         auth, ratelimit, error
│   │   ├── routes/             auth, jobs, ai, search
│   │   ├── services/           db, redis, ai
│   │   ├── utils/              logger, shouldUseAI, startupBanner
│   │   └── index.js            ← app entrypoint
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── .env.example                ← environment variable template
├── vercel.json                 ← Vercel routing config
├── API.md
├── ARCHITECTURE.md
├── DEPLOYMENT.md
├── IMPLEMENTATION.md
└── README.md
```
