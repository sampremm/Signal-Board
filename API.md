# API Reference

**Base URL (Production):** `https://signal-board-eb7y.vercel.app/api`  
**Base URL (Development):** `http://localhost:5001/api`

All requests and responses use `application/json`.  
Protected routes require `Authorization: Bearer <token>` in the request header.

---

## Health

### `GET /api/health`

No authentication required.

**Response `200`**
```json
{
  "success": true,
  "status": "healthy",
  "runtime": "Node.js + Express",
  "architecture": "Vercel Serverless (client) + Node API (server)",
  "timestamp": "2026-07-28T17:56:02.891Z"
}
```

---

## Auth — `/api/auth`

### `POST /api/auth/register`

Creates a new `User` and simultaneously creates a linked `Employer` or `Candidate` profile (1-to-1 entity separation).

**Request body**

For a Candidate:
```json
{
  "email": "candidate@example.com",
  "password": "yourpassword",
  "role": "CANDIDATE",
  "firstName": "Sam",
  "lastName": "Thalla",
  "skills": ["React", "Node.js", "PostgreSQL"]
}
```

For an Employer:
```json
{
  "email": "employer@example.com",
  "password": "yourpassword",
  "role": "EMPLOYER",
  "companyName": "Apex Technologies"
}
```

**Response `201`**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": "uuid",
    "email": "candidate@example.com",
    "role": "CANDIDATE",
    "profileId": "candidate-profile-uuid",
    "firstName": "Sam",
    "lastName": "Thalla"
  }
}
```

**Errors**
- `400` — Missing `email`, `password`, or `role`
- `409` — Email already registered

---

### `POST /api/auth/login`

Validates credentials and issues a 7-day JWT.

**Request body**
```json
{
  "email": "candidate@signalboard.ai",
  "password": "demo1234"
}
```

**Response `200`**
```json
{
  "success": true,
  "token": "<jwt>",
  "user": {
    "id": "cand_demo_uuid",
    "email": "candidate@signalboard.ai",
    "role": "CANDIDATE",
    "profileId": "cand_profile_id_1",
    "firstName": "Sam",
    "lastName": "Thalla"
  }
}
```

**Errors**
- `400` — Missing email or password
- `401` — Invalid credentials

> **Fallback:** When the database is offline, the server falls back to two hardcoded demo accounts: `candidate@signalboard.ai` / `demo1234` and `employer@signalboard.ai` / `demo1234`.

---

### `GET /api/auth/me`

Decodes and returns the identity embedded in the JWT. Does **not** query the database.

**Headers:** `Authorization: Bearer <token>`

**Response `200`**
```json
{
  "success": true,
  "user": {
    "id": "uuid",
    "email": "candidate@signalboard.ai",
    "role": "CANDIDATE",
    "profileId": "cand_profile_id_1",
    "firstName": "Sam",
    "lastName": "Thalla",
    "iat": 1785261367,
    "exp": 1785866167
  }
}
```

**Errors**
- `401` — No token provided
- `401` — Token expired or invalid signature

---

## Jobs — `/api/jobs`

### `GET /api/jobs`

Returns all job listings, newest first. No authentication required.

**Response `200`**
```json
{
  "success": true,
  "jobs": [
    {
      "id": "uuid",
      "employerId": "employer-uuid",
      "title": "Senior Full Stack Engineer",
      "description": "...",
      "location": "San Francisco, CA (Remote Option)",
      "isRemote": true,
      "salaryRange": "$160,000 - $210,000 / year",
      "skills": ["React", "Node.js", "PostgreSQL"],
      "createdAt": "2026-07-25T13:24:39.865Z",
      "updatedAt": "2026-07-25T13:24:39.865Z",
      "companyName": "Apex Distributed Technologies",
      "employer": { "id": "...", "companyName": "Apex Distributed Technologies" }
    }
  ]
}
```

> Falls back to a hardcoded seed list when the database is unreachable.

---

### `GET /api/jobs/:id`

Returns details of a specific job by UUID.

**Response `200`**
```json
{
  "success": true,
  "job": { ... }
}
```

**Errors**
- `404` — Job not found

---

### `POST /api/jobs`

Creates a new job posting. Requires a valid JWT with `role = EMPLOYER`.

**Headers:** `Authorization: Bearer <employer-token>`

**Request body**
```json
{
  "title": "Lead AI Engineer",
  "description": "## Role Summary\n...",
  "location": "Remote",
  "isRemote": true,
  "salaryRange": "$180,000 - $230,000 / year",
  "skills": ["Python", "Gemini API", "PostgreSQL"]
}
```

**Response `201`**
```json
{
  "success": true,
  "job": { "id": "new-uuid", "title": "Lead AI Engineer", ... }
}
```

**Errors**
- `401` — No/invalid JWT
- `403` — JWT belongs to a `CANDIDATE`

---

### `POST /api/jobs/:id/apply`

Submits an application. Requires a valid JWT with `role = CANDIDATE`.

**Headers:** `Authorization: Bearer <candidate-token>`

**Request body**
```json
{
  "coverLetter": "I am a great fit for this role because..."
}
```

**Response `201`**
```json
{
  "success": true,
  "message": "Application submitted successfully.",
  "application": {
    "id": "app-uuid",
    "jobId": "job-uuid",
    "candidateId": "candidate-profile-uuid",
    "status": "SUBMITTED",
    "appliedAt": "2026-07-28T17:56:02.891Z"
  }
}
```

**Errors**
- `401` — No/invalid JWT
- `403` — JWT belongs to an `EMPLOYER`
- `409` — Candidate has already applied to this job

---

## AI — `/api/ai`

### `POST /api/ai/generate-job`

Generates a structured, professional job description from rough hiring manager notes using Google Gemini AI.

> Rate limited (when Redis is configured: 15 requests / 60 seconds per IP).

**Request body**
```json
{
  "title": "Senior Backend Engineer",
  "companyName": "Apex Technologies",
  "rawNotes": "Need React and Node, Postgres, remote OK, 150k-180k, Redis a plus"
}
```

**Response `200`**
```json
{
  "success": true,
  "data": {
    "formattedDescription": "# Senior Role: Senior Backend Engineer at Apex Technologies\n\n### Role Summary\n...",
    "model": "gemini-2.0-flash-lite",
    "generatedAt": "2026-07-28T17:56:02.891Z"
  }
}
```

> **AI Fallback chain:** Gemini (`gemini-2.0-flash-lite`) → Groq (`llama-3.3-70b-versatile`) → local Markdown template.

---

## Search — `/api/search`

### `POST /api/search/ai-search`

Hybrid natural language job search. Parses a conversational query into structured filters using AI, then queries the database.

> Rate limited (when Redis is configured: 15 requests / 60 seconds per IP).

**Request body**
```json
{
  "query": "remote senior React engineer with PostgreSQL experience"
}
```

**Response `200`**
```json
{
  "success": true,
  "jobs": [ { ... } ],
  "extractedParameters": {
    "title": "React",
    "location": null,
    "isRemote": true,
    "skills": ["React", "PostgreSQL"],
    "salaryLevel": "senior",
    "parsedBy": "gemini"
  },
  "resultCount": 3,
  "fromDatabase": true,
  "usedAI": true,
  "searchEngine": "gemini_live"
}
```

> **AI Fallback chain:** Groq → Gemini → local heuristic regex parser.  
> AI results are cached in Redis for 1 hour (when Redis is configured).
