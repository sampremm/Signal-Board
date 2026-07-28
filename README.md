# Signal Board

Signal Board is an antifragile, distributed serverless web application that connects engineering talent with top-tier technology roles. It features an **AI-Assisted Technical Recruiter Workbench** for generating job postings and an intelligent **Hybrid Search Pipeline** for candidates to search using natural language.

## Project Overview

- **Frontend:** React, Vite, Tailwind CSS v4
- **Backend:** Node.js, Express, Prisma ORM
- **Database:** PostgreSQL (Neon Serverless)
- **Cache/Rate Limiting:** Upstash Redis (TCP & REST fallback)
- **AI Integration:** Groq (Llama-3), Google Gemini, Heuristic Fallback
- **External Search:** SerpAPI (Google Jobs)

## Quick Start

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/signal-board.git
cd signal-board

# Install backend dependencies
cd server
npm install

# Install frontend dependencies
cd ../client
npm install
```

### Environment Setup

Copy the example `.env` file to configure your local environment:

```bash
cp .env.example .env
```
Fill in your database URL, JWT secret, Redis URL, and API keys for SerpAPI, Groq, and Gemini.

### Running Locally

To run the application locally, you can start the backend and frontend servers in separate terminals.

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```

The application will be accessible at `http://localhost:5173`.

## Documentation Hub

For detailed information about the system architecture, API, and deployment, please refer to the following documentation:

- [Architecture Guide](./ARCHITECTURE.md) - Deep dive into the system design, AI pipelines, and tech stack.
- [Deployment Guide](./DEPLOYMENT.md) - Instructions for Vercel deployment, GitHub Actions, and environment variables.
- [API Reference](./API.md) - Comprehensive documentation of all REST endpoints.
- [Implementation Details](./IMPLEMENTATION.md) - Historical context on system design choices and antifragile fallbacks.
