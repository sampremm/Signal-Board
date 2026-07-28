/**
 * shouldUseAI.js
 * AI Decision Logic Engine
 *
 * Prevents unnecessary AI API calls and reduces costs by routing simple keyword,
 * location, and role queries directly to heuristic parsing.
 * AI is invoked only when natural language intent, recommendations, salary queries,
 * or complex semantic criteria are present.
 */

const AI_INTENT_PATTERNS = [
  'recommend',
  'suggest',
  'similar',
  'best',
  'salary',
  'package',
  'lpa',
  'ctc',
  'experience',
  'skills',
  'remote',
  'compare',
  'based on',
  'according to',
  'which',
  'should i',
  'help me',
  'career',
  'advice',
  'matching',
  'highest paying',
  'top companies',
  'entry level',
  'work from home',
];

/**
 * Determines whether a user search query requires LLM semantic parsing.
 *
 * @param {string} query
 * @returns {boolean} True if query should invoke AI, false for direct heuristic parse.
 */
export function shouldUseAI(query) {
  if (!query || typeof query !== 'string') return false;

  const text = query.trim().toLowerCase();
  if (!text) return false;

  const words = text.split(/\s+/);

  // Simple query short-circuit: 1 to 3 words without intent keywords (e.g. "React jobs", "Node.js Hyderabad", "Java Remote", "Python Developer")
  if (words.length <= 3) {
    const hasIntent = AI_INTENT_PATTERNS.some((pattern) => text.includes(pattern));
    if (!hasIntent) return false;
  }

  // If query length > 5 words, use AI parsing
  if (words.length > 5) return true;

  // Check if intent patterns match
  return AI_INTENT_PATTERNS.some((pattern) => text.includes(pattern));
}
