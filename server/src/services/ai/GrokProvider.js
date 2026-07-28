import dotenv from 'dotenv';
import { logger } from '../../utils/logger.util.js';

dotenv.config();

function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`[Grok] Request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export class GrokProvider {
  static isConfigured() {
    return !!(process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY);
  }

  static async parseSearch(queryText) {
    if (!this.isConfigured()) {
      throw new Error('[Grok] Neither GROQ_API_KEY nor OPENROUTER_API_KEY is configured.');
    }

    const prompt = `You are an AI Smart Search parser for a technical recruiting job board.
Analyze the following candidate search query: "${queryText}"

Extract parameters into a strict JSON object with exact matching criteria:
1. "title": Substring of job role title searched (e.g., "Node", "Frontend", "Full Stack", "DevOps", "React"). Null if unspecified.
2. "location": City, country, or geography mentioned (e.g., "Hyderabad", "New York", "London"). Null if unspecified.
3. "isRemote": Boolean true if keywords like "remote", "work from home", "wfh", "anywhere" appear; false if explicitly "onsite"; null if unmentioned.
4. "skills": Array of technical tools or languages mentioned (e.g., ["React", "JavaScript", "Prisma", "Python", "Node.js"]). Empty array [] if none found.
5. "salaryKeywords": Compensation queries if present. Null if none.

Respond ONLY with valid, raw JSON without markdown code blocks.`;

    const systemInstruction = 'You are a precise JSON query parser for a technical job board.';

    try {
      const rawText = await this.callApi(prompt, systemInstruction);
      const cleanText = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanText);
      logger.info('Grok', 'Successfully parsed search parameters.');
      return {
        title: parsed.title || undefined,
        location: parsed.location || undefined,
        isRemote: typeof parsed.isRemote === 'boolean' ? parsed.isRemote : undefined,
        skills: Array.isArray(parsed.skills) ? parsed.skills : [],
        salaryKeywords: parsed.salaryKeywords || undefined,
        rawQuery: queryText,
        parsedBy: 'grok_live',
      };
    } catch (err) {
      logger.warn('Grok', `Search parsing failed (${err?.message || err}).`);
      throw err;
    }
  }

  static async generateJobDescription(rawNotes, companyName = 'Signal Board Partner', title = 'Software Engineer') {
    if (!this.isConfigured()) {
      throw new Error('[Grok] Neither GROQ_API_KEY nor OPENROUTER_API_KEY is configured.');
    }

    const systemInstruction = 'You are an expert technical recruiter and HR specialist.';
    const prompt = `Write a professional job description for "${title}" at "${companyName}".
Raw Notes: "${rawNotes}"

Format in clean Markdown with: Summary, Responsibilities, Qualifications, Benefits.
Return ONLY markdown text.`;

    try {
      const text = await this.callApi(prompt, systemInstruction);
      logger.info('Grok', 'Successfully generated job description.');
      return text;
    } catch (err) {
      logger.warn('Grok', `Job description generation failed (${err?.message || err}).`);
      throw err;
    }
  }

  static async callApi(prompt, systemInstruction = '') {
    // Option A: Groq API (Ultra-fast, Llama 3.3)
    if (process.env.GROQ_API_KEY) {
      logger.info('Grok', 'Calling Groq API (llama-3.3-70b-versatile)...');
      const res = await withTimeout(
        fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              { role: 'user', content: prompt },
            ],
            temperature: 0.5,
          }),
        }),
        5000
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[Grok] Groq API returned status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('[Grok] Groq response contained empty content.');
      return content;
    }

    // Option B: OpenRouter API
    if (process.env.OPENROUTER_API_KEY) {
      logger.info('Grok', 'Calling OpenRouter API...');
      const res = await withTimeout(
        fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'meta-llama/llama-3-8b-instruct:free',
            messages: [
              ...(systemInstruction ? [{ role: 'system', content: systemInstruction }] : []),
              { role: 'user', content: prompt },
            ],
          }),
        }),
        5000
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`[Grok] OpenRouter API returned status ${res.status}: ${errText}`);
      }

      const data = await res.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) throw new Error('[Grok] OpenRouter response contained empty content.');
      return content;
    }

    throw new Error('[Grok] No valid fallback API keys configured.');
  }
}
