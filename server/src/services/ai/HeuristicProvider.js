/**
 * HeuristicProvider.js
 * Deterministic keyword & regex search parser.
 * Requires 0 API calls, runs instantly, 100% reliable fallback.
 */

import { logger } from '../../utils/logger.util.js';

export class HeuristicProvider {
  static parseSearch(queryText) {
    logger.info('Heuristic', `Parsing query: "${queryText}"`);
    const text = queryText.toLowerCase();
    const isRemote = /remote|wfh|work from home|anywhere/i.test(text);

    const techKeywords = [
      'react', 'node', 'javascript', 'typescript', 'python', 'java', 'prisma',
      'postgres', 'postgresql', 'tailwind', 'next', 'express', 'gemini', 'ai',
      'redis', 'vercel', 'docker', 'aws', 'graphql', 'mongodb', 'angular', 'vue'
    ];

    const foundSkills = [];
    techKeywords.forEach((tech) => {
      if (new RegExp(`\\b${tech}\\b`, 'i').test(text)) {
        foundSkills.push(tech.charAt(0).toUpperCase() + tech.slice(1));
      }
    });

    let titleGuess = undefined;
    if (/frontend/i.test(text)) titleGuess = 'Frontend';
    else if (/backend/i.test(text)) titleGuess = 'Backend';
    else if (/full[\s-]?stack/i.test(text)) titleGuess = 'Full Stack';
    else if (/node/i.test(text)) titleGuess = 'Node';
    else if (/react/i.test(text)) titleGuess = 'React';
    else if (/python/i.test(text)) titleGuess = 'Python';
    else if (/java/i.test(text)) titleGuess = 'Java';
    else if (/devops/i.test(text)) titleGuess = 'DevOps';
    else if (/engineer|developer|architect/i.test(text)) {
      const words = queryText.split(/\s+/);
      const idx = words.findIndex((w) => /engineer|developer|architect/i.test(w));
      if (idx > 0) titleGuess = `${words[idx - 1]} ${words[idx]}`;
    }

    let locationGuess = undefined;
    if (/hyderabad/i.test(text)) locationGuess = 'Hyderabad';
    else if (/bangalore|bengaluru/i.test(text)) locationGuess = 'Bangalore';
    else if (/mumbai/i.test(text)) locationGuess = 'Mumbai';
    else if (/chennai/i.test(text)) locationGuess = 'Chennai';
    else if (/pune/i.test(text)) locationGuess = 'Pune';
    else if (/delhi|noida|gurgaon/i.test(text)) locationGuess = 'Delhi NCR';
    else if (/san francisco/i.test(text)) locationGuess = 'San Francisco';
    else if (/new york/i.test(text)) locationGuess = 'New York';
    else if (/london/i.test(text)) locationGuess = 'London';

    return {
      title: titleGuess,
      location: locationGuess,
      isRemote: isRemote || undefined,
      skills: foundSkills,
      salaryKeywords: /salary|lpa|ctc|package|\$|₹/i.test(text) ? queryText : undefined,
      rawQuery: queryText,
      parsedBy: 'heuristic',
    };
  }

  static generateJobDescription(rawNotes, companyName = 'Signal Board Partner', title = 'Software Engineer') {
    logger.info('Heuristic', `Generating template job description for "${title}" at "${companyName}"`);
    return `# Senior Role: ${title} at ${companyName}

### Role Summary
We are actively recruiting an exceptional **${title}** to architect scalable systems and deliver outstanding business value at **${companyName}**.

### Key Responsibilities
* Design, build, and deploy backend API routes and responsive React client interfaces.
* Collaborate with product leadership to translate business directives into fault-tolerant database models and API integrations.
* Implement strict code quality standards, automated test pipelines, and fail-fast CI/CD health workflows.
* ${rawNotes ? `Address core objectives noted by engineering leadership: *${rawNotes}*` : 'Optimize application storage layers using connection pooling and caching.'}

### Required Technical Qualifications
* Extensive hands-on proficiency in JavaScript, Node.js, Express, React, Tailwind CSS v4, and Vite.
* Deep mastery of relational database design (PostgreSQL) with split-entity schema modeling and Prisma ORM.
* Experience with Node.js serverless deployment.

### Nice-to-Have Skills
* Practical experience integrating LLM APIs for smart natural language Search & Content Generation.
* Familiarity with Redis REST integrations for rate limiting.

### Why Join Us
* Competitive compensation packages designed to reward technical leadership and innovation.
* Autonomy over system architectural paradigms in a results-driven engineering culture.
*(Note: AI generation unavailable — formatted via safe heuristic template engine.)*`;
  }
}
