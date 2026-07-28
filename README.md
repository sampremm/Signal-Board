# Signal Board — AI-Powered Job Platform

> **Live Demo:** https://signal-board-delta.vercel.app  
> **Backend API:** https://signal-board-eb7y.vercel.app  
> **Health Check:** https://signal-board-eb7y.vercel.app/api/health  
> **Repository:** https://github.com/sampremm/Signal-Board

---

## What Is Signal Board?

Signal Board is a production-deployed, full-stack AI job board that connects engineering talent with top-tier technology roles. It was built entirely with AI assistance to demonstrate real-world applied AI development, from architecture design to CI/CD pipeline creation.

The application features two core AI-powered workflows:

1. **Employer AI Studio** — Transform rough hiring notes into structured, professional job descriptions in seconds using Google Gemini AI.
2. **Candidate Smart Search** — Describe the job you want in plain English. An AI pipeline extracts structured search parameters (title, location, skills, remote preference, salary range) from your query and returns relevant openings.

The system is built for **antifragility** — if one AI provider goes down, it transparently fails over to the next. If all AI providers are unavailable, a local heuristic engine takes over so the product never breaks.

---

## Assessment Checklist

| Requirement | Status | Artifact |
| :--- | :--- | :--- |
| Build a web app with AI and business value | ✅ Done | [Live Demo](https://signal-board-delta.vercel.app) |
| Push code to Git | ✅ Done | [GitHub Repository](https://github.com/sampremm/Signal-Board) |
| Write CI/CD pipeline using AI on Git | ✅ Done | [`.github/workflows/`](.github/workflows/) |
| Deploy to Vercel using CI/CD | ✅ Done | Auto-deploys on every `git push` to `main` |
| Write documentation using AI | ✅ Done | [README](./README.md), [Architecture](./ARCHITECTURE.md), [API](./API.md), [Deployment](./DEPLOYMENT.md) |

---

## Technology Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Vite + Tailwind CSS v4 | Component-based SPA |
| **Backend** | Node.js + Express | REST API serverless functions |
| **Database** | PostgreSQL via Neon Serverless | Relational job + user storage |
| **ORM** | Prisma | Type-safe DB queries |
| **Cache / Rate Limiting** | Upstash Redis (REST) | Request caching & circuit breaking |
| **AI Primary** | Groq (Llama-3) | Ultra-low-latency NLP parsing |
| **AI Secondary** | Google Gemini 2.0 Flash | Job description generation & NLP fallback |
| **AI Tertiary** | Local heuristic regex engine | Zero-dependency offline fallback |
| **Deployment** | Vercel (Serverless) | Global CDN + auto-scaling |
| **CI/CD** | GitHub Actions | Automated validation & deployment |
| **Search** | SerpAPI (Google Jobs) | Live real-time job discovery |
| **Auth** | JWT (RS256) | Stateless identity management |

---

## Core Features

### 1. Role-Based Access Control (Two-Sided Platform)

The platform strictly enforces identity separation between two user types:

**Candidate (Job Seeker):**
- Searches for jobs using AI-powered natural language queries
- Applies to jobs with a cover letter
- Cannot post, edit, or delete jobs
- Cannot access the Employer Studio

**Employer (Recruiter):**
- Generates job descriptions using AI
- Publishes jobs directly to the live database
- Views their own posted positions
- Cannot apply for jobs

### 2. AI Hybrid Search Pipeline

When a candidate types `"remote senior React engineer with PostgreSQL experience"`, the system:

1. Sends the raw query to **Groq Llama-3** for JSON extraction
2. Falls back to **Gemini** if Groq is unavailable
3. Falls back to a **local regex heuristic** if all AI is offline
4. Returns structured parameters `{ title, location, skills, isRemote, salaryLevel }`
5. Executes a filtered database query against Neon PostgreSQL
6. Merges with live results from SerpAPI

### 3. Antifragile Architecture

Every dependency has a fallback. The system never crashes due to a missing service:

- **Redis unavailable** → continues without caching
- **Groq offline** → switches to Gemini
- **Gemini offline** → uses heuristic parser
- **Database offline** → serves hardcoded seed jobs

---

## Architecture Diagram

```
┌────────────────────────────────────────────────────────────┐
│                  Vercel Global CDN (Frontend)              │
│           React 18 + Vite + Tailwind CSS v4 SPA           │
│  [ Job Feed ] [ Smart Search ] [ Employer AI Studio ]      │
└──────────────────────┬─────────────────────────────────────┘
                       │  REST/JSON (Axios with JWT)
                       │
┌──────────────────────▼─────────────────────────────────────┐
│              Vercel Serverless Functions (Backend)         │
│                  Node.js + Express API                     │
│  /api/auth   /api/jobs   /api/search   /api/ai  /api/health│
└────┬──────────────────┬───────────────────┬────────────────┘
     │                  │                   │
     ▼                  ▼                   ▼
┌─────────┐     ┌───────────────┐   ┌────────────────────┐
│  Neon   │     │ Upstash Redis │   │ AI Pipeline        │
│Postgres │     │ (Rate Limit + │   │ 1. Groq Llama-3    │
│  ORM:   │     │  Cache)       │   │ 2. Gemini 2.0 Flash│
│ Prisma  │     └───────────────┘   │ 3. Heuristic Regex │
└─────────┘                         └────────────────────┘
```

---

## API Reference

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/health` | No | Health check |
| `POST` | `/api/auth/register` | No | Create Candidate or Employer account |
| `POST` | `/api/auth/login` | No | Login + receive JWT |
| `GET` | `/api/auth/me` | JWT | Validate and decode active session |
| `GET` | `/api/jobs` | No | Fetch all job listings |
| `GET` | `/api/jobs/:id` | No | Get a specific job |
| `POST` | `/api/jobs` | Employer | Create a job posting |
| `POST` | `/api/jobs/:id/apply` | Candidate | Submit an application |
| `POST` | `/api/search/ai-search` | No | Natural language AI job search |
| `POST` | `/api/ai/generate-job` | No | Generate AI job description |

---

## CI/CD Pipeline

The project includes a GitHub Actions workflow (`.github/workflows/`) that runs on every push to `main`:

1. **Backend CI** — Install `npm ci`, validate Prisma schema, generate Prisma client
2. **Frontend CI** — Install `npm ci`, run build (`vite build`)
3. **Auto Deploy** — Vercel's GitHub Integration triggers a production deployment automatically after both checks pass

---

## Quick Start

```bash
# 1. Clone
git clone https://github.com/sampremm/Signal-Board.git
cd Signal-Board

# 2. Install backend
cd server && npm install

# 3. Install frontend
cd ../client && npm install

# 4. Configure environment (copy and fill in your keys)
cp .env.example server/.env

# 5. Start backend (port 5001)
cd server && npm run dev

# 6. Start frontend (port 5173)
cd ../client && npm run dev
```

Open `http://localhost:5173` in your browser.

### Demo Credentials

| Role | Email | Password |
| :--- | :--- | :--- |
| Candidate | `candidate@signalboard.ai` | `demo1234` |
| Employer | `employer@signalboard.ai` | `demo1234` |

---

## Documentation

| Document | Description |
| :--- | :--- |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | System design, AI pipelines, fallback strategy |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Vercel deployment, environment variables, CI/CD |
| [API.md](./API.md) | Full REST API reference with request/response examples |
| [IMPLEMENTATION.md](./IMPLEMENTATION.md) | Design decisions and antifragile patterns |

---

## Deployment

- **Frontend (Live App):** https://signal-board-delta.vercel.app
- **Backend API:** https://signal-board-eb7y.vercel.app
- **Health Check:** https://signal-board-eb7y.vercel.app/api/health

---

## License

MIT © Sam Prem Kumar Thalla
