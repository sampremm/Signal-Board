import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'signal-board-jwt-secret-2026';

/**
 * Stateless Authentication Middleware in pure JavaScript
 * Enforces JWT token validation without requiring fragile session store database dips in memory.
 */
export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ error: 'Unauthorized: Missing or invalid authentication token.' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(403).json({ error: 'Forbidden: Expired or invalid token signature.' });
  }
};

/**
 * Optional Authentication Middleware
 * Attaches user to request if JWT present, otherwise proceeds gracefully (useful for job browsing).
 */
export const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      req.user = jwt.verify(token, JWT_SECRET);
    }
  } catch {
    // Proceed unauthenticated without rejecting
  }
  next();
};

/**
 * Role-Based Access Control (RBAC) Guard
 */
export const requireRole = (role) => {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      res.status(403).json({ error: `Access Denied: Required account role: ${role}.` });
      return;
    }
    next();
  };
};
