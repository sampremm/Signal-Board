import { SearchService } from '../services/search/SearchService.js';
import { logger } from '../utils/logger.util.js';

// Fallback mock jobs for demonstrations when Postgres Neon serverless is unconfigured or offline
export const fallbackJobs = [
  {
    id: 'job_1',
    title: 'Senior Full Stack Distributed Engineer (Node/React)',
    companyName: 'Apex Distributed Technologies',
    location: 'San Francisco, CA (Remote)',
    isRemote: true,
    salaryRange: '$160,000 - $210,000 / year',
    skills: ['React', 'JavaScript', 'Node.js', 'PostgreSQL', 'Tailwind', 'Vite'],
    description: `### Role Summary\nWe are looking for a **Full Stack Engineer** to drive resilient systems development. You will build REST API routes and responsive client experiences.\n\n### Key Responsibilities\n* Build and maintain backend API routes and real-time interactive user interfaces.\n* Leverage connection-pooled PostgreSQL storage layers over Neon infrastructure.\n* Enhance automated testing pipelines and deployment workflows.\n\n### Required Technical Qualifications\n* Deep proficiency in JavaScript, React 18+, Node.js, and Express.\n* Experience with Prisma ORM and distributed caching over Redis.`,
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    employerId: 'emp_demo_uuid',
  },
  {
    id: 'job_2',
    title: 'Lead AI Applications Architect (Gemini / LLM Integration)',
    companyName: 'Neural Signal Core Labs',
    location: 'New York, NY (Hybrid Remote)',
    isRemote: true,
    salaryRange: '$180,000 - $240,000 / year',
    skills: ['Gemini AI', 'Python', 'JavaScript', 'PostgreSQL', 'Redis', 'Docker'],
    description: `### Role Summary\nJoin Neural Signal Core Labs as our **Lead AI Architect**, integrating Google's gemini-2.0-flash-lite model via the @google/genai SDK into real-time analytical dashboards.\n\n### Key Responsibilities\n* Develop conversational parsing engines and natural language querying transformers.\n* Build Redis rate-limiter boundaries and implement caching strategies.\n* Optimize prompt structuring and schema verification across data streams.`,
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
    employerId: 'emp_2',
  },
  {
    id: 'job_3',
    title: 'Staff Frontend Systems Engineer (Vite + Tailwind CSS v4)',
    companyName: 'HyperEdge Interactive',
    location: 'Austin, TX',
    isRemote: false,
    salaryRange: '$145,000 - $185,000 / year',
    skills: ['React', 'Vite', 'Tailwind CSS v4', 'JavaScript', 'CSS', 'Framer Motion'],
    description: `### Role Summary\nWe are hiring a passionate **Staff Frontend Systems Engineer** to build ultra-sleek, premium dark-mode web experiences with flawless animations and responsive design systems using Tailwind CSS v4 Vite Plugin.\n\n### Key Responsibilities\n* Construct glassmorphism card components, micro-interactions, and vibrant styling palettes.\n* Deliver high-performance frontend bundles utilizing Vite build optimization.\n* Implement SEO best practices and accessibility standards across all views.`,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    employerId: 'emp_3',
  },
  {
    id: 'job_4',
    title: 'Junior Remote Node.js & Prisma Developer',
    companyName: 'CloudScale Ventures',
    location: 'Remote (US / Europe)',
    isRemote: true,
    salaryRange: '$85,000 - $115,000 / year',
    skills: ['Node.js', 'Express', 'Prisma', 'PostgreSQL', 'JavaScript'],
    description: `### Role Summary\nAn exciting career foundation role for an enthusiastic **Junior Node.js Developer** to work on backend REST routing and database relational modeling.\n\n### Key Responsibilities\n* Support backend REST APIs, unit test generation, and Prisma migration workflows.\n* Collaborate with senior engineers on Vercel Node deployments.`,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    employerId: 'emp_4',
  },
  {
    id: 'job_5',
    title: 'Senior Node.js & Distributed Systems Engineer',
    companyName: 'Apex Distributed Technologies (India)',
    location: 'Bengaluru, India (Remote Available)',
    isRemote: true,
    salaryRange: '₹28,000,000 - ₹38,000,000 / year (₹28 - ₹38 LPA)',
    skills: ['Node.js', 'Express', 'PostgreSQL', 'Prisma', 'Redis', 'JavaScript'],
    description: `### Role Summary\nWe are looking for a Senior **Node.js Engineer** based in India to build backend REST APIs, Redis rate limiters, and connection-pooled PostgreSQL models.\n\n### Key Responsibilities\n* Architect high-scale backend REST APIs using Node.js, Express, and Prisma ORM.\n* Build connection-pooled Neon PostgreSQL data layers and Redis caching.\n* Work remotely from anywhere in India with global engineering teams.`,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
    employerId: 'emp_demo_uuid',
  },
  {
    id: 'job_6',
    title: 'NodeJS Developers Jobs',
    companyName: 'Aegis Softtech',
    location: 'Rajkot, Gujarat, India (Bangalore, Pune, Hyderabad, Mumbai)',
    isRemote: true,
    salaryRange: '₹18,000,000 - ₹28,000,000 / year (₹18 - ₹28 LPA)',
    skills: ['Node.js', 'Express', 'JavaScript', 'REST APIs', 'PostgreSQL'],
    description: `### Role Summary\nCheck out career openings for **NodeJS developers** at Aegis Softtech. Openings across Bangalore, Pune, Hyderabad, Mumbai, and Delhi locations.\n\n### Key Responsibilities\n* Develop high-performance backend REST APIs using Node.js & Express.\n* Ensure application scalability and optimal database connection pooling.`,
    createdAt: new Date(Date.now() - 3600000 * 3).toISOString(),
    employerId: 'emp_3',
  },
  {
    id: 'job_7',
    title: 'Node.js Developer (3–5 Yrs)',
    companyName: 'Tudip Technologies Pvt Ltd',
    location: 'Maharashtra, India',
    isRemote: true,
    salaryRange: '₹20,000,000 - ₹30,000,000 / year (₹20 - ₹30 LPA)',
    skills: ['Node.js', 'Express.js', 'PostgreSQL', 'MongoDB', 'REST APIs', 'Git'],
    description: `### Role Summary\nTudip Technologies (CMMI Level 5) is hiring a **Node.js Developer** with 3–5 years experience to build scalable backend applications.\n\n### Key Responsibilities\n* Design and build RESTful APIs and microservices using Node.js and Express.\n* Manage PostgreSQL/MongoDB databases and integrate third-party APIs.`,
    createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    employerId: 'emp_2',
  },
  {
    id: 'job_8',
    title: 'Senior NodeJS Developer (Microservices)',
    companyName: 'Synechron Technologies Pvt. Ltd.',
    location: 'Chennai, Tamil Nadu, India',
    isRemote: false,
    salaryRange: '₹26,000,000 - ₹38,000,000 / year (₹26 - ₹38 LPA)',
    skills: ['Node.js', 'Express.js', 'Microservices', 'PostgreSQL', 'Docker', 'AWS'],
    description: `### Role Summary\nSynechron is seeking a **Senior NodeJS Developer** (5+ yrs) in Chennai to develop microservices and scale digital financial technology platforms.\n\n### Key Responsibilities\n* Develop server-side logic, APIs, and containerized Node.js microservices.\n* Optimize application performance and conduct technical code reviews.`,
    createdAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    employerId: 'emp_demo_uuid',
  },
  {
    id: 'job_9',
    title: 'NodeJs Developer (Remote)',
    companyName: 'Alzion Labs',
    location: 'Remote, Maharashtra, India',
    isRemote: true,
    salaryRange: '₹16,000,000 - ₹24,000,000 / year (₹16 - ₹24 LPA)',
    skills: ['Node.js', 'JavaScript', 'REST APIs', 'PostgreSQL', 'Express'],
    description: `### Role Summary\nAlzion Labs is looking for a **Node.js Developer** to create robust, clean, and performant backend APIs in a fast-paced environment.\n\n### Key Responsibilities\n* Work closely with product teams to build performant Node.js REST APIs.\n* Turn business logic into secure, clean code following best practices.`,
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    employerId: 'emp_4',
  },
];

export const searchJobs = async (req, res, next) => {
  try {
    const { query } = req.body;

    if (!query || typeof query !== 'string' || !query.trim()) {
      return res.status(400).json({ success: false, error: 'Please supply a natural language query string.' });
    }

    const result = await SearchService.search(query.trim());
    res.status(200).json(result);
  } catch (error) {
    logger.error('Search', 'Error handling search request', error);
    res.status(200).json({
      success: true,
      count: fallbackJobs.length,
      jobs: fallbackJobs,
      extractedParameters: { rawQuery: req.body?.query || '' },
      fromDatabase: false,
      searchEngine: 'heuristic_emergency_fallback',
    });
  }
};
