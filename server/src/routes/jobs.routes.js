import { Router } from 'express';
import { authenticate, requireRole } from '../middleware/auth.middleware.js';
import * as jobsController from '../controllers/jobs.controller.js';

const router = Router();

/**
 * GET /api/jobs
 * Fetch all available job listings with optional pagination and standard keyword filtering.
 */
router.get('/', jobsController.getJobs);

/**
 * GET /api/jobs/:id
 * Retrieve comprehensive details for a specific job posting.
 */
router.get('/:id', jobsController.getJobById);

/**
 * POST /api/jobs
 * Employer creates and publishes a newly formatted job posting.
 */
router.post('/', authenticate, requireRole('EMPLOYER'), jobsController.createJob);

/**
 * POST /api/jobs/:id/apply
 * Candidate submits a digital application to a job posting.
 */
router.post('/:id/apply', authenticate, requireRole('CANDIDATE'), jobsController.applyToJob);

export default router;
