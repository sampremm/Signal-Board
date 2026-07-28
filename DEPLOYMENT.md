# Deployment Guide

Signal Board is designed for zero-configuration deployments using **Vercel** and **GitHub Actions**.

## 1. Clone the Repository

```bash
git clone https://github.com/your-org/signal-board.git
cd signal-board
```

## 2. Install Dependencies

You must install dependencies in both the `client` and `server` folders.

```bash
cd server && npm install
cd ../client && npm install
```

## 3. Configure Environment Variables

Create `.env` files based on the `.env.example` in the repository root. Ensure the backend has access to:
- `DATABASE_URL` (PostgreSQL connection string)
- `REDIS_URL` (Upstash connection string)
- `GROQ_API_KEY`
- `GEMINI_API_KEY`
- `SERPAPI_API_KEY`
- `JWT_SECRET`

## 4. Run Locally

To test production builds locally:
```bash
# Backend
cd server
npm run build # Generates Prisma Client
npm start

# Frontend
cd client
npm run build
npm run preview
```

## 5. Configure GitHub Secrets

For the GitHub Actions CI/CD pipeline to deploy to Vercel, you must configure the following Secrets in your GitHub repository (`Settings > Secrets and variables > Actions`):
- `VERCEL_TOKEN`: Generated from your Vercel account settings.
- `VERCEL_ORG_ID`: Your Vercel Organization ID.
- `VERCEL_PROJECT_ID`: Your Vercel Project ID.

## 6. Automatic Deployment Flow (CI/CD)

Whenever you push to the `main` branch:
1. GitHub Actions triggers `.github/workflows/vercel.yml`.
2. The pipeline installs dependencies and runs `lint` and `build` checks for both frontend and backend.
3. If all checks pass, the pipeline uses the Vercel CLI to deploy the application automatically.
4. The deployment strictly follows the routing configurations defined in the root `vercel.json`.
