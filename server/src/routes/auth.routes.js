import { Router } from 'express';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

/**
 * POST /api/auth/register
 * Implements Entity Separation by creating User + 1-to-1 relational Employer or Candidate profile.
 */
router.post('/register', authController.register);

/**
 * POST /api/auth/login
 * Validates credentials and returns JWT with embedded 1-to-1 split entity profile data.
 */
router.post('/login', authController.login);

/**
 * GET /api/auth/me
 * Validates active token signature and returns identity.
 */
router.get('/me', authController.getMe);

export default router;
