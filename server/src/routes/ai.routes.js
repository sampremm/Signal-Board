import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { rateLimitMiddleware } from '../middleware/ratelimit.middleware.js';
import * as aiController from '../controllers/ai.controller.js';

const router = Router();

/**
 * Feature 1: AI-Assisted Job Generation (Employer-Facing)
 * Endpoint: POST /api/ai/generate-job
 */
router.post('/generate-job', rateLimitMiddleware, aiController.generateJob);

export default router;
