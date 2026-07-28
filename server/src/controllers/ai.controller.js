import { AIProvider } from '../services/ai/AIProvider.js';
import { logger } from '../utils/logger.util.js';

export const generateJob = async (req, res, next) => {
  try {
    const { rawNotes, title, companyName } = req.body;

    if (!rawNotes || typeof rawNotes !== 'string') {
      return res.status(400).json({ success: false, error: 'Please provide rough notes (rawNotes string) for AI job description generation.' });
    }

    const jobTitle = title || 'Senior Technology Professional';
    const employerCompany = companyName || req.user?.companyName || 'Signal Board Partner';

    const formattedDescription = await AIProvider.generateJobDescription(rawNotes, employerCompany, jobTitle);

    res.status(200).json({
      success: true,
      data: {
        formattedDescription,
        model: 'gemini-2.0-flash-lite',
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
};
