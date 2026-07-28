import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db, withDbRetry } from '../services/db.service.js';
import { logger } from '../utils/logger.util.js';

const JWT_SECRET = process.env.JWT_SECRET || 'signal-board-jwt-secret-2026';

// In-memory persistent fallback store for when Neon PostgreSQL credentials are offline in local dev
const fallbackUsers = [
  {
    id: 'emp_demo_uuid',
    email: 'employer@signalboard.ai',
    password: bcrypt.hashSync('demo1234', 10),
    role: 'EMPLOYER',
    companyName: 'Apex Distributed Technologies',
    profileId: 'emp_profile_id_1',
  },
  {
    id: 'cand_demo_uuid',
    email: 'candidate@signalboard.ai',
    password: bcrypt.hashSync('demo1234', 10),
    role: 'CANDIDATE',
    firstName: 'Sam',
    lastName: 'Thalla',
    skills: ['JavaScript', 'React', 'PostgreSQL', 'Vite', 'Gemini AI', 'Node.js', 'Tailwind CSS'],
    profileId: 'cand_profile_id_1',
  },
];

export const register = async (req, res, next) => {
  try {
    const { email, password, role, companyName, firstName, lastName, resumeText, skills } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ success: false, error: 'Missing required fields: email, password, and role.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    let tokenPayload = null;

    try {
      // Attempt database insertion over pooled connection
      const existing = await withDbRetry(() => db.user.findUnique({ where: { email } }));
      if (existing) {
        return res.status(409).json({ success: false, error: 'User account already exists with this email address.' });
      }

      if (role === 'EMPLOYER') {
        const newUser = await withDbRetry(() => db.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'EMPLOYER',
            employer: {
              create: {
                companyName: companyName || 'Signal Board Corporate Partner',
              },
            },
          },
          include: { employer: true },
        }));
        
        tokenPayload = {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          profileId: newUser.employer?.id,
          companyName: newUser.employer?.companyName,
        };
      } else {
        const newUser = await withDbRetry(() => db.user.create({
          data: {
            email,
            password: hashedPassword,
            role: 'CANDIDATE',
            candidate: {
              create: {
                firstName: firstName || 'Talent',
                lastName: lastName || 'Candidate',
                resumeText: resumeText || null,
                skills: Array.isArray(skills) ? skills : [],
              },
            },
          },
          include: { candidate: true },
        }));

        tokenPayload = {
          id: newUser.id,
          email: newUser.email,
          role: newUser.role,
          profileId: newUser.candidate?.id,
          firstName: newUser.candidate?.firstName,
          lastName: newUser.candidate?.lastName,
        };
      }
    } catch (dbError) {
      logger.warn('Auth', 'Database offline during registration. Using resilient fallback in-memory registration', dbError.message);
      
      const newId = `user_${Date.now()}`;
      const profileId = `profile_${Date.now()}`;
      const fallbackEntry = {
        id: newId,
        email,
        password: hashedPassword,
        role,
        profileId,
        companyName: role === 'EMPLOYER' ? (companyName || 'Apex Technologies') : undefined,
        firstName: role === 'CANDIDATE' ? (firstName || 'Sam') : undefined,
        lastName: role === 'CANDIDATE' ? (lastName || 'Thalla') : undefined,
        skills: role === 'CANDIDATE' ? (Array.isArray(skills) ? skills : ['React', 'JavaScript', 'Node.js', 'PostgreSQL']) : undefined,
      };

      fallbackUsers.push(fallbackEntry);
      tokenPayload = {
        id: fallbackEntry.id,
        email: fallbackEntry.email,
        role: fallbackEntry.role,
        profileId: fallbackEntry.profileId,
        companyName: fallbackEntry.companyName,
        firstName: fallbackEntry.firstName,
        lastName: fallbackEntry.lastName,
      };
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    res.status(201).json({ success: true, token, user: tokenPayload });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, error: 'Please supply both email and password.' });
    }

    let tokenPayload = null;
    let validPassword = false;

    try {
      const dbUser = await withDbRetry(() => db.user.findUnique({
        where: { email },
        include: { employer: true, candidate: true },
      }));

      if (dbUser) {
        validPassword = await bcrypt.compare(password, dbUser.password);
        if (validPassword) {
          tokenPayload = {
            id: dbUser.id,
            email: dbUser.email,
            role: dbUser.role,
            profileId: dbUser.role === 'EMPLOYER' ? dbUser.employer?.id : dbUser.candidate?.id,
            companyName: dbUser.employer?.companyName,
            firstName: dbUser.candidate?.firstName,
            lastName: dbUser.candidate?.lastName,
          };
        }
      }
    } catch (dbError) {
      logger.warn('Auth', 'Database offline during login. Consulting resilient in-memory credentials.');
    }

    // Check fallback user store if database did not resolve
    if (!tokenPayload) {
      const mock = fallbackUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
      if (mock && await bcrypt.compare(password, mock.password)) {
        tokenPayload = {
          id: mock.id,
          email: mock.email,
          role: mock.role,
          profileId: mock.profileId,
          companyName: mock.companyName,
          firstName: mock.firstName,
          lastName: mock.lastName,
        };
      }
    }

    if (!tokenPayload) {
      return res.status(401).json({ success: false, error: 'Invalid email address or password credentials.' });
    }

    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });
    res.status(200).json({ success: true, token, user: tokenPayload });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, error: 'No authorization header supplied.' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    res.status(200).json({ success: true, user: decoded });
  } catch {
    res.status(401).json({ success: false, error: 'Token expired or unsigned.' });
  }
};
