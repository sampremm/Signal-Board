# Signal Board — Implementation Guide

**Author:** Sam Prem Kumar Thalla  
**Context:** Globalco technical assessment (React/Tailwind client, Express/Prisma API, Neon PostgreSQL, Gemini AI).

---

## 1. Overview

Signal Board is a two-sided job board. Employers post roles and can draft descriptions with an AI assist. Candidates search with plain-language queries and apply directly.

The repo is a monorepo with two independently deployable units: `client/` (React SPA) and `server/` (Express API). Each has its own `package.json` and CI job. The split is a convenience for independent deployment, not an architectural claim.

---

## 2. Architecture

```
Browser
  │
  ▼
React 18 + Vite + Tailwind CSS  (client/, port 5173)
  │  HTTP / JSON  (proxied to :5001 in dev via vite.config.js)
  ▼
Express.js API  (server/, port 5001)
  │
  ├─► Prisma ORM ──► Neon PostgreSQL     (users, jobs, applications)
  ├─► @google/genai ──► Gemini API       (job-description drafting, search parsing)
  └─► Upstash Redis REST (optional)      (rate limiting, AI query cache — see §8)
```

### Client navigation

`App.jsx` manages an `activeTab` state (`'LANDING'` | `'SEARCH'` | `'GENERATE'`). There is no React Router and no URL-based routing. `react-router-dom` is listed in `package.json` but is not used.

### Server structure

```
server/src/
  index.js              — app bootstrap, CORS, route mounting
  routes/
    auth.routes.js      — register, login, /me
    ai.routes.js        — AI job description generation
    jobs.routes.js      — job CRUD and applications
    search.routes.js    — AI smart search + fallback job data
  services/
    ai.service.js       — Gemini client (gemini-2.0-flash-lite)
    db.service.js       — Prisma singleton + withDbRetry()
    redis.service.js    — Upstash / ioredis circuit breaker
  middleware/
    auth.middleware.js  — JWT verification, RBAC guards
    ratelimit.middleware.js — Redis-backed rate limiter
  utils/
    shouldUseAI.js      — hybrid AI/heuristic search decision
```

---

## 3. Stack

| Layer | Choice | Why |
|---|---|---|
| Frontend | React 18, Vite, Tailwind CSS v4 | Fast dev loop; Tailwind scopes styles to markup at this project size |
| Backend | Express.js | Minimal; easy to reason about for ~10 routes |
| ORM / DB | Prisma + Neon Postgres | Schema-as-code migrations; managed Postgres without provisioning |
| AI | `gemini-2.0-flash-lite` via `@google/genai` | One call site for drafting, one for search parsing |
| Cache / rate limit | Upstash Redis (REST) | REST-based; survives serverless cold starts without a persistent TCP connection |
| Deploy | Vercel | Client as static Vite build; server as Node serverless functions |

---

## 4. Data model

Exact schema from `server/prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

enum UserRole          { EMPLOYER  CANDIDATE }
enum ApplicationStatus { SUBMITTED REVIEWING ACCEPTED REJECTED }

model User {
  id        String    @id @default(uuid())
  email     String    @unique
  password  String    // bcrypt hash
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
  id           String        @id @default(uuid())
  userId       String        @unique
  firstName    String
  lastName     String
  resumeText   String?
  skills       String[]
  createdAt    DateTime      @default(now())
  user         User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  applications Application[]
}

model Job {
  id           String        @id @default(uuid())
  employerId   String
  title        String
  description  String
  location     String
  isRemote     Boolean       @default(false)
  salaryRange  String?
  skills       String[]
  createdAt    DateTime      @default(now())
  updatedAt    DateTime      @updatedAt
  employer     Employer      @relation(fields: [employerId], references: [id], onDelete: Cascade)
  applications Application[]
}

model Application {
  id          String            @id @default(uuid())
  jobId       String
  candidateId String
  status      ApplicationStatus @default(SUBMITTED)
  coverLetter String?
  appliedAt   DateTime          @default(now())
  job         Job               @relation(fields: [jobId], references: [id], onDelete: Cascade)
  candidate   Candidate         @relation(fields: [candidateId], references: [id], onDelete: Cascade)
  @@unique([jobId, candidateId])
}
```

**Why `User` is split from `Employer`/`Candidate`:** a single user table with nullable columns forces every query to reason about which columns are valid for which role, and migrations for one role touch a table the other depends on. Two narrow 1:1 tables avoid both problems at the cost of an extra join per profile read — an explicit trade-off.

**`@@unique([jobId, candidateId])`** on `Application` prevents a candidate from submitting duplicate applications to the same job at the database level.

---

## 5. API reference

All routes are implemented and respond. Routes documented here but not in the code, or in the code but not here, are a bug — fix the mismatch, don't leave it.

| Method | Path | Auth | Purpose |
|---|---|---|---|
| GET | `/api/health` | none | Liveness probe |
| POST | `/api/auth/register` | none | Create `User` + linked `Employer` or `Candidate` |
| POST | `/api/auth/login` | none | Verify bcrypt hash, issue 7-day JWT |
| GET | `/api/auth/me` | Bearer JWT | Decode and return token identity |
| GET | `/api/jobs` | none | List all jobs, newest first |
| GET | `/api/jobs/:id` | none | Single job detail |
| POST | `/api/jobs` | JWT, `role=EMPLOYER` | Create a job posting |
| POST | `/api/jobs/:id/apply` | JWT, `role=CANDIDATE` | Submit an application |
| POST | `/api/ai/generate-job` | JWT (any role) + rate limit | Generate a job description from raw notes |
| POST | `/api/search/ai-search` | none | Parse a natural-language query into job filters |

**Auth note on `/api/ai/generate-job`:** the route applies `rateLimitMiddleware` then `authenticate`. There is no `requireRole` guard — any holder of a valid JWT (employer or candidate) can call it.

**Not implemented:** `PUT /api/jobs/:id`, `DELETE /api/jobs/:id`, `GET /api/applications`.

### Health check response

```json
{
  "status": "OK",
  "runtime": "Vercel Node & Local Express (Pure JS)",
  "architecture": "Vercel Serverless (client) + Node API (server)",
  "timestamp": "2026-07-27T18:00:00.000Z"
}
```

### Register request body

```json
{
  "email": "candidate@example.com",
  "password": "securePassword",
  "role": "CANDIDATE",
  "firstName": "Sam",
  "lastName": "Thalla",
  "skills": ["React", "Node.js"]
}
```

For `EMPLOYER`, use `companyName` instead of `firstName`/`lastName`/`skills`.

### Login / register response

```json
{
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "candidate@example.com",
    "role": "CANDIDATE",
    "profileId": "profile-uuid",
    "firstName": "Sam",
    "lastName": "Thalla"
  }
}
```

### AI generate-job request

```json
{
  "title": "Senior Full Stack Engineer",
  "companyName": "Acme Corp",
  "rawNotes": "Need React and Node, Postgres, remote OK, 150k-180k"
}
```

Response: `{ "success": true, "data": { "formattedDescription": "...", "model": "gemini-2.0-flash-lite", "generatedAt": "..." } }`

### AI search request / response

Request: `{ "query": "remote junior node.js roles" }`

Response:
```json
{
  "success": true,
  "extractedParameters": { "title": "Node.js", "isRemote": true, "skills": ["Node", "JavaScript"] },
  "resultCount": 4,
  "fromDatabase": true,
  "usedAI": false,
  "jobs": []
}
```

---

## 6. Authentication & authorization

- Passwords are hashed with bcrypt (salt rounds: 10) before storage.
- `/api/auth/login` issues a 7-day JWT containing `{ id, email, role, profileId, ... }`.
- `authenticate` middleware verifies the JWT signature; returns 401 if missing, 403 if invalid.
- `optionalAuth` attaches `req.user` if a token is present, proceeds unauthenticated otherwise (used for public job browsing).
- `requireRole(r)` runs after `authenticate` and returns 403 if `req.user.role !== r`.
- `/api/auth/me` decodes the token without a database call.

**Fallback:** When Neon is offline, `auth.routes.js` falls back to an in-memory user store seeded with two demo accounts:

| Role | Email | Password |
|---|---|---|
| Employer | employer@signalboard.ai | demo1234 |
| Candidate | candidate@signalboard.ai | demo1234 |

**Known trade-off:** stateless JWTs cannot be revoked before they expire. A real production system would use short-lived access tokens with refresh-token rotation.

---

## 7. AI integration

### Employer flow — `POST /api/ai/generate-job`

Takes `title`, `companyName`, and `rawNotes` from the request body. Builds a recruiter-persona prompt that constrains the model to the provided notes (to prevent invented requirements) and returns structured Markdown. A hard 8-second timeout (`withTimeout()`) protects against hanging Gemini connections.

**Fallback chain:** Gemini (`gemini-2.0-flash-lite`) → Groq (`llama-3.3-70b-versatile` if `GROQ_API_KEY` set) → structured Markdown template fallback.

### Candidate flow — `POST /api/search/ai-search`

Before calling Gemini, `shouldUseAI(query)` decides whether AI parsing is warranted:

1. **Word count > 6** → use AI (`reason: 'long_query'`)
2. **Contains intent phrase** (`"recommend"`, `"salary"`, `"entry level"`, `"work from home"`, etc.) → use AI (`reason: 'keyword_match:<phrase>'`)
3. **Short keyword** → skip AI, use heuristic filter (`reason: 'simple_keyword'`)

AI-parsed results are cached in Redis for 1 hour (when Redis is configured). The heuristic path has no external dependency and returns instantly.

**Fallback chain:** Gemini → Groq (if configured) → heuristic parser.

---

## 8. Rate limiting and caching

### Redis adapter priority (from `redis.service.js`)

| Priority | Env var | Transport | Use case |
|---|---|---|---|
| 1 | `REDIS_URL` | TCP (ioredis) | Local dev, Redis Cloud |
| 2 | `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` | HTTP/REST | Vercel serverless |
| 3 | Neither set | In-process fallback | Demo / offline |

### Current state

`UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are empty strings in `.env`. `REDIS_URL` is commented out. **Redis is not configured. Rate limiting and caching are not enforced.** All AI requests pass through unchecked and every complex query hits Gemini live.

This is deliberate fail-open behavior — the code is written to allow traffic through when the cache is unavailable rather than blocking valid requests.

To enable: provision a free Upstash instance and set the two env vars, or set `REDIS_URL` for a standard Redis connection.

### What rate limiting does when Redis is configured

- Sliding window: 15 requests / 60 seconds per `req.user.id`, `req.ip`, or `x-forwarded-for`
- Headers: `X-RateLimit-Limit`, `X-RateLimit-Remaining`
- Response on exceeded: `429 Too Many Requests`
- AI query cache TTL: 1 hour (`ai_cache:<normalized_query>`)
- Circuit breaker: trips after 5 sequential upstream failures (`circuit_failures:<endpoint>`)

---

## 9. Environment variables

```ini
# server/.env

PORT=5001
NODE_ENV="development"

# Neon PostgreSQL
DATABASE_URL="postgresql://user:pass@ep-pooler.region.aws.neon.tech/db?sslmode=require&pgbouncer=true"
DIRECT_URL="postgresql://user:pass@ep-direct.region.aws.neon.tech/db?sslmode=require"

# Redis (choose one or neither)
REDIS_URL="redis://default:pass@host:port"                   # Option A: TCP
UPSTASH_REDIS_REST_URL="https://your-instance.upstash.io"   # Option B: REST
UPSTASH_REDIS_REST_TOKEN="your_token"

# Gemini
GEMINI_API_KEY="AIzaSy..."

# JWT
JWT_SECRET="your-secret-key"
```

---

## 10. Deployment

- **Client:** Vite static build deployed to Vercel.
- **Server:** Express routes as Vercel Node serverless functions.
- **Database:** Neon Postgres. `DATABASE_URL` uses the pooled connection string (pgBouncer) for the running app; `DIRECT_URL` is the unpooled string used by Prisma migrations only.
- **Secrets:** All env vars are set in Vercel project settings and GitHub Actions secrets — nothing is committed to the repo.

---

## 11. CI/CD

A unified GitHub Actions pipeline (`.github/workflows/vercel.yml`) handles the build and deployment process.

**`vercel.yml`** — fires on pushes to `main`:
1. **`backend-checks` Job:** Checks out the server, installs dependencies, validates the Prisma schema, and builds the Prisma client.
2. **`frontend-checks` Job:** Checks out the client, installs dependencies, runs ESLint (`npm run lint`), and builds the static assets.
3. **`deploy` Job:** Only runs if both the backend and frontend checks pass. Uses the `vercel` CLI to pull environment information and deploy to the Vercel production environment automatically.

This ensures no broken code is ever deployed.


---

## 12. Known limitations

- **No token revocation.** JWTs are valid for 7 days even if a user is deleted or disabled. Fix: short-lived access tokens + refresh token rotation.
- **Rate limiting unenforced.** Redis is not provisioned in this deployment (§8).
- **`/api/ai/generate-job` is not role-gated.** Any authenticated user (employer or candidate) can call it. `requireRole('EMPLOYER')` is not applied.
- **No automated tests.** All verification is manual end-to-end.
- **`react-router-dom` installed but unused.** Navigation is `activeTab` state in `App.jsx`.
- **In-memory fallback** for users and jobs is a demo safety net, not a cache or primary store.
- **Not implemented:** `PUT /api/jobs/:id`, `DELETE /api/jobs/:id`, `GET /api/applications`, resume upload, email notifications, saved searches.

---

## 13. Testing performed

Manually, end to end, before submission:

- Register as EMPLOYER → login → generate AI job description → publish job
- Register as CANDIDATE → login → short keyword search → long natural-language search → apply to a job
- Verify application appears in the application response

Results are reported in the audit section below.
