# Signal Board — Implementation Guide

**Author:** Sam Prem Kumar Thalla  
**Project:** Globalco technical assessment — AI-powered two-sided job board  
**Stack:** React 18 + Vite + Tailwind CSS v4 · Node.js + Express · Neon PostgreSQL + Prisma · Google Gemini + Groq · Vercel

---

## 1. Overview

Signal Board is a two-sided job board. Employers post roles and draft descriptions with AI assist. Candidates search with plain-language queries and apply directly.

The repo is a monorepo with two independently deployable units:
- `client/` — React SPA
- `server/` — Express API

Each has its own `package.json` and its own CI job. Both deploy automatically to Vercel on `git push` to `main`.

---

## 2. Architecture

```
Browser
  │
  ▼
React 18 + Vite + Tailwind CSS v4  (client/, port 5173 in dev)
  │  HTTP/JSON — Axios (single instance, JWT interceptor)
  │  Dev: Vite proxy /api → localhost:5001
  │  Prod: VITE_API_URL → Vercel backend
  ▼
Express.js API  (server/, port 5001 in dev; Vercel serverless in prod)
  │
  ├─► Prisma ORM ──► Neon PostgreSQL     (users, jobs, applications)
  ├─► Google Gemini API                  (job-description drafting, NLP search parsing)
  ├─► Groq API (Llama-3)                 (NLP search parsing fallback)
  └─► Upstash Redis REST                 (rate limiting, AI query cache — optional)
```

### Client navigation

`App.jsx` manages `activeTab` state: `'LANDING'` | `'SEARCH'` | `'GENERATE'`. No React Router. Navigation is pure state switching.

### Server structure

```
server/src/
  index.js                  — bootstrap, CORS, global error handlers, route mounting
  routes/
    auth.routes.js           — /register, /login, /me
    ai.routes.js             — /generate-job
    jobs.routes.js           — job CRUD + applications
    search.routes.js         — /ai-search
  controllers/
    auth.controller.js       — bcrypt, JWT issuance, in-memory fallback users
    jobs.controller.js       — Prisma queries + fallback seed data
    ai.controller.js         — Gemini → Groq → template cascade
    search.controller.js     — shouldUseAI → Redis cache → AI parsing → DB filter
  services/
    db.service.js            — Prisma Proxy singleton + withDbRetry()
    redis.service.js         — TCP (ioredis) → Upstash REST → in-process no-op
    ai.service.js            — Gemini client wrapper with 8s timeout
  middleware/
    auth.middleware.js        — authenticate (JWT verify), requireRole (RBAC)
    ratelimit.middleware.js   — Redis sliding-window limiter, fail-open
    error.middleware.js       — global Express error handler
  utils/
    logger.util.js            — structured console logger
    shouldUseAI.js            — query complexity heuristic (word count + intent phrases)
    startupBanner.js          — dev console banner
```

---

## 3. Stack Decisions

| Layer | Choice | Reason |
| :--- | :--- | :--- |
| Frontend | React 18, Vite 5, Tailwind CSS v4 | Fast build times; Tailwind v4 Vite plugin, no PostCSS config needed |
| Backend | Express.js (pure ES Modules) | Minimal overhead for ~10 routes; easy Vercel serverless compatibility |
| ORM / DB | Prisma + Neon Postgres | Schema-as-code migrations; serverless-compatible with pgBouncer pooling |
| AI primary | `gemini-2.0-flash-lite` via `@google/genai` | Fast, low-cost, strong JSON output for NLP extraction |
| AI secondary | Groq `llama-3.3-70b-versatile` | Ultra-low latency backup when Gemini is slow or rate-limited |
| AI tertiary | Local heuristic regex | Zero-dependency guaranteed fallback; never breaks |
| Cache | Upstash Redis REST | REST-based; survives serverless cold starts (no TCP keep-alive) |
| Deploy | Vercel (two projects: client, server) | Zero-config static + serverless; auto-deploy from GitHub |
| Auth | JWT (HMAC-SHA256, 7-day expiry) | Stateless; no session store needed for serverless |

---

## 4. Data Model

Exact schema — `server/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")     // pooled (pgBouncer) — used by the app
  directUrl = env("DIRECT_URL")       // unpooled — used by prisma migrate/db push
}

enum UserRole          { EMPLOYER  CANDIDATE }
enum ApplicationStatus { SUBMITTED REVIEWING ACCEPTED REJECTED }

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String    // bcrypt hash, 10 rounds
  role      UserRole
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt
  employer  Employer?
  candidate Candidate?
}

model Employer {
  id          String   @id @default(uuid())
  userId      String   @unique
  companyName String
  websiteUrl  String?
  description String?
  createdAt   DateTime @default(now())
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  jobs        Job[]
}

model Candidate {
  id          String        @id @default(uuid())
  userId      String        @unique
  firstName   String
  lastName    String
  resumeText  String?
  skills      String[]
  createdAt   DateTime      @default(now())
  user        User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  applications Application[]
}

model Job {
  id          String        @id @default(uuid())
  employerId  String
  title       String
  description String
  location    String
  isRemote    Boolean       @default(false)
  salaryRange String?
  skills      String[]
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt
  employer    Employer      @relation(fields: [employerId], references: [id], onDelete: Cascade)
  applications Application[]
}

model Application {
  id          String            @id @default(uuid())
  jobId       String
  candidateId String
  status      ApplicationStatus @default(SUBMITTED)
  coverLetter String?
  appliedAt   DateTime          @default(now())
  job         Job       @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidate   Candidate @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  @@unique([jobId, candidateId])
}
```

**Why User is split from Employer/Candidate:** A single table with nullable role-specific columns forces every query to handle columns that are irrelevant for the current role. Two narrow 1-to-1 tables eliminate that ambiguity at the cost of one extra join per profile read. The `@@unique([jobId, candidateId])` constraint on `Application` prevents duplicate applications at the database level.

---

## 5. API Reference

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| GET | `/api/health` | none | Liveness probe |
| POST | `/api/auth/register` | none | Create `User` + linked `Employer` or `Candidate` |
| POST | `/api/auth/login` | none | Verify bcrypt hash, issue 7-day JWT |
| GET | `/api/auth/me` | Bearer JWT | Decode and return token identity (no DB call) |
| GET | `/api/jobs` | none | List all jobs, newest first |
| GET | `/api/jobs/:id` | none | Single job detail |
| POST | `/api/jobs` | JWT + `role=EMPLOYER` | Create a job posting |
| POST | `/api/jobs/:id/apply` | JWT + `role=CANDIDATE` | Submit an application |
| POST | `/api/ai/generate-job` | rate limit | Generate a job description from raw notes |
| POST | `/api/search/ai-search` | rate limit | Parse natural-language query into job filters |

**Not implemented:** `PUT /api/jobs/:id`, `DELETE /api/jobs/:id`, `GET /api/applications`, resume upload, saved searches, notifications.

---

## 6. Authentication & Authorization

- Passwords hashed with bcrypt (10 salt rounds) before storage.
- Login issues a 7-day JWT containing `{ id, email, role, profileId, firstName?, lastName?, companyName? }`.
- `authenticate` middleware verifies the JWT signature; returns `401` if missing, `401` if expired/invalid.
- `requireRole(r)` runs after `authenticate`; returns `403` if `req.user.role !== r`.
- `/api/auth/me` decodes the token without a database call.
- **Fallback:** When Neon is offline, `auth.controller.js` falls back to an in-memory user store:

| Role | Email | Password |
| :--- | :--- | :--- |
| Employer | employer@signalboard.ai | demo1234 |
| Candidate | candidate@signalboard.ai | demo1234 |

**Known trade-off:** Stateless JWTs cannot be revoked before expiry. A production system would use short-lived access tokens with refresh-token rotation.

---

## 7. AI Integration

### Employer flow — `POST /api/ai/generate-job`

Takes `title`, `companyName`, and `rawNotes`. Builds a recruiter-persona prompt that constrains the model to the provided notes (prevents invented requirements). Returns structured Markdown.

**Fallback chain:** Gemini (`gemini-2.0-flash-lite`, 8s timeout) → Groq (`llama-3.3-70b-versatile`) → local Markdown template.

### Candidate flow — `POST /api/search/ai-search`

Before calling any AI, `shouldUseAI(query)` gates whether parsing is needed:
1. Word count > 6 → use AI (`reason: 'long_query'`)
2. Contains intent phrase (`"remote"`, `"salary"`, `"entry level"`, `"senior"`, etc.) → use AI
3. Short plain keyword → skip AI, use heuristic filter instantly

**Fallback chain:** Redis cache hit → Groq → Gemini → heuristic regex parser.  
Cache TTL: 1 hour (key: `ai_cache:<normalized_query>`).

---

## 8. Rate Limiting & Caching

### Redis adapter priority (`redis.service.js`)

| Priority | Env var | Transport | Use case |
| :--- | :--- | :--- | :--- |
| 1 | `REDIS_URL` | TCP (ioredis) | Local dev, Redis Cloud |
| 2 | `UPSTASH_REDIS_REST_URL` + token | HTTP REST | Vercel serverless |
| 3 | Neither | In-process no-op | Demo / offline |

### When Redis is configured

- Sliding window: 15 requests / 60 seconds per `req.user.id` or `req.ip`
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Exceeded: `429 Too Many Requests`
- AI query cache TTL: 1 hour
- Circuit breaker: trips after 5 sequential upstream failures

### Current production status

Redis is configured in the production Vercel project via `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. When unavailable, rate limiting is skipped (fail-open) and all requests pass through.

---

## 9. Environment Variables

```ini
# Required
DATABASE_URL   # Neon pooled connection string (pgBouncer)
DIRECT_URL     # Neon direct connection string (for prisma db push)
JWT_SECRET     # Secret for HMAC-SHA256 JWT signing

# Optional — AI providers
GEMINI_API_KEY  # Google Gemini (primary AI)
GROQ_API_KEY    # Groq Llama-3 (secondary AI)
SERPAPI_API_KEY # Google Jobs live results

# Optional — Cache
REDIS_URL                    # Option A: TCP Redis
UPSTASH_REDIS_REST_URL       # Option B: Upstash REST (recommended for Vercel)
UPSTASH_REDIS_REST_TOKEN

# Frontend only (Vite build-time)
VITE_API_URL   # Backend base URL (e.g. https://signal-board-eb7y.vercel.app)
```

---

## 10. Frontend API Client Design

Single Axios instance in `client/src/services/api.js`:

```javascript
let rawApiUrl = import.meta.env?.VITE_API_URL || 'https://signal-board-eb7y.vercel.app/api';
rawApiUrl = rawApiUrl.replace(/\/+$/, '');
const API_BASE_URL = rawApiUrl.endsWith('/api') ? rawApiUrl : `${rawApiUrl}/api`;
```

This normalization prevents the `/auth/login` vs `/api/auth/login` mismatch that occurs when `VITE_API_URL` is set without the `/api` suffix.

Request interceptor injects `Authorization: Bearer <token>` from `localStorage.signal_board_token`.  
Response interceptor normalizes all errors to `{ success, message, code, details }`.

`getJobs(signal?)` accepts an optional `AbortSignal` passed from the component's `AbortController`, enabling proper request cancellation on unmount and preventing stale state updates.

---

## 11. useEffect Dependency Fix

**Problem:** `handleSmartSearch` was in the `useEffect` dependency array. Its identity changed whenever the `query` state updated (typing). Each identity change triggered the effect, firing a fresh `GET /api/jobs` mid-keystroke — visible as multiple `(cancelled)` requests in DevTools.

**Fix:** `handleSmartSearch` is accessed via a stable `useRef` inside the effect. The ref is updated in a separate `useEffect` whenever `handleSmartSearch` changes. The main effect only depends on `[headerQuery, fetchInitialJobs]`, both of which are stable. An `AbortController` is created per effect run and aborted in the cleanup function.

```javascript
const handleSmartSearchRef = useRef(handleSmartSearch);
useEffect(() => {
  handleSmartSearchRef.current = handleSmartSearch;
}, [handleSmartSearch]);

useEffect(() => {
  const controller = new AbortController();
  if (headerQuery?.trim()) {
    handleSmartSearchRef.current(headerQuery);
  } else {
    fetchInitialJobs(controller.signal);
  }
  return () => controller.abort();
}, [headerQuery, fetchInitialJobs]); // stable — no re-runs on typing
```

---

## 12. CI/CD Pipeline

`.github/workflows/vercel.yml` runs on every push to `main` or `develop`:

**backend-checks job:**
1. `npm ci` in `./server`
2. `npx prisma validate` (with mock `DATABASE_URL`/`DIRECT_URL`)
3. `npm run build` → `prisma generate`

**frontend-checks job:**
1. `npm ci` in `./client`
2. `npm run build` → Vite production build

After both pass, Vercel's GitHub Integration deploys both projects automatically. There is no separate deploy job.

---

## 13. Deployment

- **Frontend:** Vite static build → Vercel CDN. `VITE_*` variables are embedded at build time.
- **Backend:** Express app exported as default → Vercel Node.js serverless function. `DATABASE_URL`, `JWT_SECRET`, and AI keys are set in Vercel project Settings → Environment Variables.
- **Database:** Neon Postgres. `DATABASE_URL` uses pgBouncer pooled connection; `DIRECT_URL` is the unpooled string used only by `prisma db push`.
- **CORS:** Hardcoded in `index.js` to allow `https://signal-board-delta.vercel.app` and `localhost:5173`.

---

## 14. Known Limitations

- **No token revocation.** JWTs are valid 7 days even after logout. Fix: refresh tokens.
- **`/api/ai/generate-job` is not role-gated.** Any authenticated user can call it.
- **No automated tests.** All verification is manual end-to-end.
- **Not implemented:** `PUT /api/jobs/:id`, `DELETE /api/jobs/:id`, resume upload, email notifications, saved searches, application dashboard.
- **In-memory fallback** for users and jobs is a demo safety net, not a cache or primary store. Data written during fallback mode is lost on process restart.

---

## 15. Testing Performed

Manually, end-to-end, before submission:

- Register as EMPLOYER → login → generate AI job description → publish job to database
- Register as CANDIDATE → login → short keyword search → long natural-language search → apply to job
- Verify RBAC: Candidate cannot see Employer Studio; Employer cannot see Apply button
- Verify live backend: `GET /api/health` → 200; `POST /api/auth/login` → 200 + JWT; `GET /api/jobs` → 200 + job array
- Verify cancelled request fix: single `GET /api/jobs` on tab switch, no duplicates
