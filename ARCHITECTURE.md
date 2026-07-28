# Architecture Reference

## Overview

Signal Board relies on a robust, distributed architecture designed for **antifragility**. When external services (like Redis or LLMs) become unavailable, the system transparently degrades to local heuristics and caching to ensure zero downtime.

## Mermaid Architecture Diagram

```mermaid
flowchart TD
    %% Define styles
    classDef frontend fill:#E8F3FA,stroke:#0A66C2,stroke-width:2px,color:#0A66C2,font-weight:bold
    classDef backend fill:#E7F3ED,stroke:#057642,stroke-width:2px,color:#057642,font-weight:bold
    classDef external fill:#FFF0E0,stroke:#E68523,stroke-width:2px,color:#A65300
    classDef db fill:#F3F2EF,stroke:#666666,stroke-width:2px,color:#191919

    User((User))
    
    subgraph Client [Frontend Layer]
        React[React + Vite SPA]
    end
    
    subgraph API [Backend Layer]
        Express[Express + Node.js API]
        AIProvider[AI Pipeline Orchestrator]
    end
    
    subgraph Data [Storage Layer]
        Redis[(Upstash Redis Cache)]
        PostgreSQL[(Neon PostgreSQL)]
    end
    
    subgraph Services [External APIs]
        Groq[Groq Llama-3 API]
        Gemini[Google Gemini API]
        SerpAPI[SerpAPI Google Jobs]
    end

    %% Connections
    User <-->|HTTP/REST| React
    React <-->|Fetch/JSON| Express
    
    Express --> AIProvider
    Express <-->|Rate Limit & Cache| Redis
    Express <-->|Prisma ORM| PostgreSQL
    Express <-->|Fetch Live Jobs| SerpAPI
    
    AIProvider -->|Primary| Groq
    AIProvider -->|Secondary Fallback| Gemini
    AIProvider -->|Tertiary Fallback| Express
    
    %% Apply classes
    class React frontend
    class Express,AIProvider backend
    class Groq,Gemini,SerpAPI external
    class Redis,PostgreSQL db
```

## AI Search Pipeline

The AI Pipeline uses a "Fail-Open" cascade:
1. **Primary**: Groq (Llama-3). Extremely fast, low latency parsing.
2. **Secondary**: Google Gemini. Used if Groq hits rate limits or goes offline.
3. **Tertiary (Zero-API)**: Local heuristic regex parser. Ensures the core product never breaks even if the entire internet goes down.

## Folder Structure

```text
signal-board/
├── client/                 # React SPA (Vite + Tailwind v4)
│   ├── src/
│   │   ├── components/     # UI Components (Employer, Candidate, Common)
│   │   ├── services/       # API integration layer
│   │   └── App.jsx         # Root component with ErrorBoundary
│   └── package.json
├── server/                 # Express API (Node.js)
│   ├── src/
│   │   ├── controllers/    # Business logic (Jobs, Search, Auth, AI)
│   │   ├── middleware/     # Rate Limiting, Error Handling, Auth Verification
│   │   ├── routes/         # Express Routing
│   │   ├── services/       # Database, Cache, and AI Pipeline Orchestrators
│   │   └── index.js        # Server Entrypoint
│   ├── prisma/             # Database Schema
│   └── package.json
├── .github/workflows/      # CI/CD Pipelines
├── vercel.json             # Vercel Deployment Config
└── package.json            # Root configuration (if applicable)
```
