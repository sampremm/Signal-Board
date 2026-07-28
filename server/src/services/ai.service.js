import { AIProvider } from './ai/AIProvider.js';

export async function generateJobDescription(rawNotes, companyName, title) {
  return await AIProvider.generateJobDescription(rawNotes, companyName, title);
}

export async function parseSmartSearchQuery(queryText) {
  return await AIProvider.parseSearch(queryText);
}

export const parseSearchQuery = parseSmartSearchQuery;

export const aiService = {
  generateJobDescription,
  parseSmartSearchQuery,
  parseSearchQuery,
};

export default aiService;
