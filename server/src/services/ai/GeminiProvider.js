import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';
import { logger } from '../../utils/logger.util.js';

dotenv.config();

function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`[Gemini] Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export class GeminiProvider {
  static getClient() {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (!apiKey || apiKey === 'mock_gemini_api_key_replace_me') {
      return null;
    }
    return new GoogleGenAI({ apiKey });
  }

  static getModel() {
    return process.env.GEMINI_MODEL || 'gemini-2.0-flash';
  }

  static async parseSearch(queryText) {
    const client = this.getClient();
    if (!client) {
      throw new Error('[Gemini] API key not configured.');
    }

    const model = this.getModel();
    logger.info('Gemini', `Invoking model "${model}" for query: "${queryText}"`);

    const prompt = `You are an AI Smart Search parser for a technical recruiting job board.
Analyze the following candidate search query: "${queryText}"

Extract parameters into a strict JSON object with exact matching criteria:
1. "title": Substring of job role title searched (e.g., "Node", "Frontend", "Full Stack", "DevOps", "React"). Null if unspecified.
2. "location": City, country, or geography mentioned (e.g., "Hyderabad", "New York", "London"). Null if unspecified.
3. "isRemote": Boolean true if keywords like "remote", "work from home", "wfh", "anywhere" appear; false if explicitly "onsite"; null if unmentioned.
4. "skills": Array of technical tools or languages mentioned (e.g., ["React", "JavaScript", "Prisma", "Python", "Node.js"]). Empty array [] if none found.
5. "salaryKeywords": Compensation queries if present. Null if none.

Respond ONLY with valid, raw JSON without markdown code blocks.`;

    try {
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents: prompt,
        }),
        5000
      );

      const rawText = response.text || '';
      const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();

      if (!cleanText) {
        throw new Error('[Gemini] Received empty text response.');
      }

      const parsed = JSON.parse(cleanText);
      logger.info('Gemini', 'Successfully parsed search parameters.');
      return {
        title: parsed.title || undefined,
        location: parsed.location || undefined,
        isRemote: typeof parsed.isRemote === 'boolean' ? parsed.isRemote : undefined,
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        salaryKeywords: parsed.salaryKeywords || undefined,
        rawQuery: queryText,
        parsedBy: 'gemini_live',
      };
    } catch (err) {
      const msg = err?.message || String(err);
      logger.warn('Gemini', `Search parse failed (${msg}). Switching to secondary provider.`);
      throw new Error(`[Gemini] ${msg}`);
    }
  }

  static async generateJobDescription(rawNotes, companyName = 'Signal Board Partner', title = 'Software Engineer') {
    const client = this.getClient();
    if (!client) {
      throw new Error('[Gemini] API key not configured.');
    }

    const model = this.getModel();
    logger.info('Gemini', `Generating job description using model "${model}" for "${title}"...`);

    const prompt = `You are an expert technical recruiter and HR specialist for top-tier software engineering organizations.
Your task is to transform the following brief notes into a compelling, professional job description for "${title}" at "${companyName}".

Rough Notes: "${rawNotes}"

Format in clean Markdown with:
- **Role Summary**
- **Key Responsibilities**
- **Required Technical Qualifications**
- **Nice-to-Have Skills**
- **Why Join Us & Benefits**

Return ONLY the markdown job description without conversational filler.`;

    try {
      const response = await withTimeout(
        client.models.generateContent({
          model,
          contents: prompt,
        }),
        5000
      );

      const text = response.text || '';
      if (!text) {
        throw new Error('[Gemini] Received empty job description response.');
      }
      logger.info('Gemini', 'Successfully generated job description.');
      return text;
    } catch (err) {
      const msg = err?.message || String(err);
      logger.warn('Gemini', `Job generation failed (${msg}). Switching to secondary provider.`);
      throw new Error(`[Gemini] ${msg}`);
    }
  }
}
