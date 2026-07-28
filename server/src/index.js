import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

import authRoutes from './routes/auth.routes.js';
import aiRoutes from './routes/ai.routes.js';
import searchRoutes from './routes/search.routes.js';
import jobsRoutes from './routes/jobs.routes.js';
import { errorHandler } from './middleware/error.middleware.js';
import { logger } from './utils/logger.util.js';

dotenv.config();

// Global Error Handlers for Vercel Diagnostics
process.on('uncaughtException', (err) => {
  console.error("FATAL UNCAUGHT EXCEPTION:", err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error("FATAL UNHANDLED REJECTION at:", promise, "reason:", reason);
});

// Startup Logging for Vercel Diagnostics
console.log("Starting Signal Board...");
console.log("Loading environment...");
console.log("DATABASE_URL:", !!process.env.DATABASE_URL);
console.log("DIRECT_URL:", !!process.env.DIRECT_URL);
console.log("Initializing Prisma...");
console.log("Initializing Redis...");
console.log("Initializing AI services...");

// Startup Validation (Warn instead of crash)
if (!process.env.DATABASE_URL) {
  console.error("STARTUP ERROR: Missing required environment variable DATABASE_URL");
}
if (!process.env.JWT_SECRET) {
  console.error("STARTUP ERROR: Missing required environment variable JWT_SECRET");
}

const app = express();
const PORT = process.env.PORT || 5001;

// Middlewares
app.use(helmet());
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'http://localhost:3000', 
    'http://127.0.0.1:5173', 
    'https://signal-board-delta.vercel.app'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));
app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true }));

// Root System Health Verification Route
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    status: 'healthy',
    runtime: 'Node.js + Express',
    architecture: 'Vercel Serverless (client) + Node API (server)',
    timestamp: new Date().toISOString(),
  });
});

// API Routes & Entity Endpoints
console.log("Registering routes...");
app.use('/api/auth', authRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/jobs', jobsRoutes);

// Catch-All Global Error Recovery
app.use(errorHandler);

import { printStartupBanner } from './utils/startupBanner.js';

// Start listening only when executing locally (Vercel invokes the exported handler automatically)
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  app.listen(PORT, async () => {
    await printStartupBanner(PORT);
  });
}

console.log("Server ready.");
export default app;
