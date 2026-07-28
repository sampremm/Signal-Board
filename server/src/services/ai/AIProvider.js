import { GrokProvider } from './GrokProvider.js';
import { GeminiProvider } from './GeminiProvider.js';
import { HeuristicProvider } from './HeuristicProvider.js';
import { logger } from '../../utils/logger.util.js';

export class AIProvider {
  /**
   * Orchestrates multi-provider natural language search parsing with automatic fallback.
   * Fallback chain: Groq (Primary) -> Gemini (Secondary/Optional) -> Heuristic (Zero-API).
   * Never throws an exception to caller.
   *
   * @param {string} queryText
   * @returns {Promise<object>} Structured filter criteria
   */
  static async parseSearch(queryText) {
    // Stage 1: Try Primary Provider (Groq / OpenRouter)
    try {
      if (GrokProvider.isConfigured()) {
        logger.info('AI', `Attempting search parse with Groq for: "${queryText}"`);
        return await GrokProvider.parseSearch(queryText);
      }
    } catch (grokError) {
      logger.warn('AI', `Grok parse failed (${grokError?.message || grokError}). Degrading to Gemini fallback...`);
    }

    // Stage 2: Try Secondary Provider (Gemini)
    try {
      logger.info('AI', `Attempting search parse with Gemini for: "${queryText}"`);
      return await GeminiProvider.parseSearch(queryText);
    } catch (geminiError) {
      logger.warn('AI', `Gemini parse failed (${geminiError?.message || geminiError}). Degrading to Heuristic fallback...`);
    }

    // Stage 3: Deterministic Zero-API Heuristic Fallback
    logger.info('AI', `Utilizing Heuristic Provider fallback for: "${queryText}"`);
    return HeuristicProvider.parseSearch(queryText);
  }

  /**
   * Orchestrates job description generation with automatic fallback.
   * Fallback chain: Groq (Primary) -> Gemini (Secondary/Optional) -> Heuristic Template.
   * Never throws an exception to caller.
   *
   * @param {string} rawNotes
   * @param {string} companyName
   * @param {string} title
   * @returns {Promise<string>} Formatted Markdown description
   */
  static async generateJobDescription(rawNotes, companyName = 'Signal Board Partner', title = 'Software Engineer') {
    // Stage 1: Try Primary Provider (Groq)
    try {
      if (GrokProvider.isConfigured()) {
        logger.info('AI', `Attempting job description generation with Groq for "${title}"...`);
        return await GrokProvider.generateJobDescription(rawNotes, companyName, title);
      }
    } catch (grokError) {
      logger.warn('AI', `Grok job generation failed (${grokError?.message || grokError}). Degrading to Gemini fallback...`);
    }

    // Stage 2: Try Secondary Provider (Gemini)
    try {
      logger.info('AI', `Attempting job description generation with Gemini for "${title}"...`);
      return await GeminiProvider.generateJobDescription(rawNotes, companyName, title);
    } catch (geminiError) {
      logger.warn('AI', `Gemini job generation failed (${geminiError?.message || geminiError}). Degrading to Heuristic fallback...`);
    }

    // Stage 3: Deterministic Zero-API Heuristic Fallback
    logger.info('AI', `Utilizing Heuristic Provider job template fallback for "${title}"...`);
    return HeuristicProvider.generateJobDescription(rawNotes, companyName, title);
  }
}

export default AIProvider;
