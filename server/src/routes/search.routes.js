import { Router } from 'express';
import { rateLimitMiddleware } from '../middleware/ratelimit.middleware.js';
import * as searchController from '../controllers/search.controller.js';

const router = Router();

// Re-export fallbackJobs for jobs.controller.js
export { fallbackJobs } from '../controllers/search.controller.js';

/**
 * Feature 2: Hybrid Natural Language Smart Search (Candidate-Facing)
 * Endpoint: POST /api/search/ai-search
 */
router.post('/ai-search', rateLimitMiddleware, searchController.searchJobs);

export default router;
