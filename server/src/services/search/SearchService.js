import { shouldUseAI } from '../../utils/shouldUseAI.js';
import { AIProvider } from '../ai/AIProvider.js';
import { HeuristicProvider } from '../ai/HeuristicProvider.js';
import { cacheService } from '../cache/CacheService.js';
import { db, withDbRetry } from '../db.service.js';
import { fallbackJobs } from '../../routes/search.routes.js';
import { logger } from '../../utils/logger.util.js';
import dotenv from 'dotenv';

dotenv.config();

function withTimeout(promise, ms = 5000) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`[Search] SerpAPI request timed out after ${ms}ms`)), ms)
    ),
  ]);
}

export class SearchService {
  /**
   * Main Hybrid Search pipeline with multi-provider fallback & SerpAPI integration.
   * Never throws exceptions to caller.
   *
   * @param {string} queryText - User's search input
   * @returns {Promise<object>} Standardized search response payload
   */
  static async search(queryText) {
    logger.info('Search', `Incoming Query: "${queryText}"`);

    const needsAI = shouldUseAI(queryText);
    let extractedParams = null;
    let searchEngine = 'heuristic';

    if (!needsAI) {
      logger.info('Search', 'Query bypasses AI -> Using HeuristicProvider');
      extractedParams = HeuristicProvider.parseSearch(queryText);
      searchEngine = 'heuristic';
    } else {
      // Check cache first
      const cacheKey = `search:ai:${queryText.trim().toLowerCase()}`;
      const cachedParams = await cacheService.get(cacheKey);

      if (cachedParams) {
        logger.info('Search', `Cache hit for: "${queryText}"`);
        extractedParams = cachedParams;
        searchEngine = 'cached_ai';
      } else {
        logger.info('Search', `Cache miss -> Calling AIProvider for: "${queryText}"`);
        extractedParams = await AIProvider.parseSearch(queryText);
        searchEngine = extractedParams.parsedBy || 'ai_live';

        // Cache successful AI parses for 1 hour
        if (searchEngine !== 'heuristic') {
          await cacheService.set(cacheKey, extractedParams, 3600);
        }
      }
    }

    logger.info('Search', `Parsed Filters: ${JSON.stringify(extractedParams)}`);

    // Construct SerpAPI Query from parsed AI filters
    const queryParts = [];
    if (extractedParams.title) queryParts.push(extractedParams.title);
    if (extractedParams.skills && extractedParams.skills.length > 0) queryParts.push(...extractedParams.skills);
    if (extractedParams.location) queryParts.push(extractedParams.location);
    if (extractedParams.isRemote) queryParts.push('Remote');

    const finalSerpQuery = queryParts.length > 0 ? queryParts.join(' ') : queryText;
    logger.info('Search', `SerpAPI Query: "${finalSerpQuery}"`);

    // Execute Database & SerpAPI Search
    let dbJobs = [];
    let fromDatabase = false;

    try {
      const whereClause = {};
      const orConditions = [];

      if (extractedParams.title) {
        orConditions.push({ title: { contains: extractedParams.title, mode: 'insensitive' } });
        orConditions.push({ description: { contains: extractedParams.title, mode: 'insensitive' } });
      }

      if (extractedParams.skills && extractedParams.skills.length > 0) {
        orConditions.push({ skills: { hasSome: extractedParams.skills } });
      }

      if (orConditions.length > 0) {
        whereClause.OR = orConditions;
      }

      if (extractedParams.location) {
        whereClause.location = { contains: extractedParams.location, mode: 'insensitive' };
      }

      if (typeof extractedParams.isRemote === 'boolean') {
        whereClause.isRemote = extractedParams.isRemote;
      }

      const fetched = await withDbRetry(() =>
        db.job.findMany({
          where: whereClause,
          include: { employer: true },
          orderBy: { createdAt: 'desc' },
        })
      );

      if (fetched && fetched.length > 0) {
        dbJobs = fetched.map((j) => ({
          ...j,
          companyName: j.employer?.companyName || j.companyName || 'Enterprise Partner',
        }));
        fromDatabase = true;
      }
    } catch (dbErr) {
      logger.warn('Search', `Database query skipped or failed (failing open): ${dbErr?.message || dbErr}`);
    }

    // External Provider Integration: SerpAPI using parsed AI filters
    let serpJobs = [];
    if (process.env.SERPAPI_API_KEY) {
      try {
        logger.info('Search', `Querying SerpAPI Google Jobs with parsed query: "${finalSerpQuery}"`);
        const serpUrl = `https://serpapi.com/search.json?engine=google_jobs&q=${encodeURIComponent(finalSerpQuery)}&api_key=${process.env.SERPAPI_API_KEY}`;
        const res = await withTimeout(fetch(serpUrl), 5000);
        if (res.ok) {
          const serpData = await res.json();
          if (Array.isArray(serpData.jobs_results)) {
            serpJobs = serpData.jobs_results.map((j, idx) => ({
              id: `serp_${idx}_${Date.now()}`,
              title: j.title || 'Software Position',
              companyName: j.company_name || 'Hiring Organization',
              location: j.location || 'Remote / Unspecified',
              isRemote: /remote|wfh/i.test(j.location || '') || !!extractedParams.isRemote,
              salaryRange: j.detected_extensions?.salary || '$120,000 - $180,000 / year',
              skills: extractedParams.skills && extractedParams.skills.length > 0 ? extractedParams.skills : ['JavaScript', 'Node.js', 'React'],
              description: j.description || 'Full-time technical position listed on Google Jobs.',
              createdAt: new Date().toISOString(),
            }));
            logger.info('Search', `SerpAPI Response Count: ${serpJobs.length}`);
          }
        }
      } catch (serpErr) {
        logger.warn('Search', `SerpAPI call failed or timed out: ${serpErr?.message || serpErr}`);
      }
    }

    // Filter seed fallback jobs based on extracted AI parameters so stale recommendations are NOT shown
    const matchingSeed = (fallbackJobs || []).filter((job) => {
      let match = true;

      if (typeof extractedParams.isRemote === 'boolean' && job.isRemote !== extractedParams.isRemote) {
        match = false;
      }

      if (extractedParams.title) {
        const titleRegex = new RegExp(extractedParams.title, 'i');
        const inTitle = titleRegex.test(job.title) || titleRegex.test(job.description);
        const inSkill = job.skills.some((s) => titleRegex.test(s));
        if (!inTitle && !inSkill && extractedParams.title.length > 3) match = false;
      }

      if (extractedParams.location && !new RegExp(extractedParams.location, 'i').test(job.location)) {
        match = false;
      }

      if (extractedParams.skills && extractedParams.skills.length > 0) {
        const hasSkill = extractedParams.skills.some((reqSkill) =>
          job.skills.some((jobSkill) => new RegExp(reqSkill, 'i').test(jobSkill))
        );
        if (!hasSkill && !extractedParams.title) match = false;
      }

      return match;
    });

    // Merge: DB jobs -> SerpAPI jobs -> Filtered seed jobs
    const combined = [...dbJobs, ...serpJobs];
    const existingKeys = new Set(combined.map((j) => `${j.title?.toLowerCase()}|${j.companyName?.toLowerCase()}`));
    const uniqueSeed = matchingSeed.filter(
      (j) => !existingKeys.has(`${j.title?.toLowerCase()}|${j.companyName?.toLowerCase()}`)
    );

    const finalJobs = [...combined, ...uniqueSeed];
    logger.info('Search', `Returned Jobs Count: ${finalJobs.length}`);

    return {
      success: true,
      count: finalJobs.length,
      jobs: finalJobs,
      extractedParameters: extractedParams,
      fromDatabase: fromDatabase || serpJobs.length > 0,
      searchEngine,
    };
  }
}

export default SearchService;
