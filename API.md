# API Reference

## Base URL
In development: `http://localhost:5001/api`
In production: `https://your-deployment-url.com/api`

---

## Auth Endpoints (`/api/auth`)

### POST `/api/auth/register`
Creates a new user account (Candidate or Employer).
- **Body:** `{ name, email, password, role: 'CANDIDATE' | 'EMPLOYER', companyName? }`
- **Response:** `{ success: true, token, user }`

### POST `/api/auth/login`
Authenticates a user and returns a JWT.
- **Body:** `{ email, password }`
- **Response:** `{ success: true, token, user }`

---

## Job Endpoints (`/api/jobs`)

### GET `/api/jobs`
Fetches available jobs.
- **Query Params:** `?query=...&location=...&isRemote=true`
- **Response:** `{ success: true, jobs }`

### GET `/api/jobs/:id`
Fetches a specific job by ID.
- **Response:** `{ success: true, job }`

### POST `/api/jobs` (Protected, EMPLOYER only)
Publishes a new job.
- **Body:** `{ title, description, isRemote, location, ... }`
- **Response:** `{ success: true, job }`

### POST `/api/jobs/:id/apply` (Protected, CANDIDATE only)
Applies for a specific job.
- **Body:** `{ coverLetter }`
- **Response:** `{ success: true, message: "Application submitted" }`

---

## AI Endpoints (`/api/ai`)

### POST `/api/ai/generate-job`
Generates a professional job description from rough notes.
- **Body:** `{ rawNotes, title, companyName }`
- **Response:** `{ success: true, data: { formattedDescription, model } }`

---

## Search Endpoints (`/api/search`)

### POST `/api/search/ai-search`
Hybrid Natural Language Search processing. Identifies parameters using AI before performing the DB query.
- **Body:** `{ query: "Frontend react developer remote" }`
- **Response:** `{ success: true, jobs: [...], _meta: { parsedBy, skills, title, location } }`
