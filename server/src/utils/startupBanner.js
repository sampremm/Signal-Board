import pc from 'picocolors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { db, withDbRetry } from '../services/db.service.js';
import { cacheService } from '../services/cache/CacheService.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const printStartupBanner = async (port) => {
  // Wait a tiny bit to allow Redis connections to settle if async
  await new Promise(resolve => setTimeout(resolve, 500));

  // 1. Get Version
  let version = 'Unknown';
  try {
    const pkgPath = path.resolve(__dirname, '../../package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    version = pkg.version || '1.0.0';
  } catch (err) {
    // Ignore error
  }

  // 2. Environment & Core
  const env = process.env.NODE_ENV || 'development';
  const serverUrl = `http://localhost:${port}`;

  // 3. Check AI Providers
  const groqEnabled = !!(process.env.GROQ_API_KEY || process.env.OPENROUTER_API_KEY);
  const groqStatus = groqEnabled 
    ? pc.green('Groq (llama-3.3-70b-versatile)') 
    : pc.yellow('Disabled');

  const geminiEnabled = !!process.env.GEMINI_API_KEY && process.env.GEMINI_API_KEY !== 'mock_gemini_api_key_replace_me';
  const geminiStatus = geminiEnabled 
    ? pc.green(`${process.env.GEMINI_MODEL || 'gemini-2.0-flash'} (optional)`) 
    : pc.yellow('Disabled');

  // 4. Check Redis Cache
  let redisStatus = pc.yellow('Disconnected (Using in-memory fallback)');
  if (cacheService.isAvailable) {
    redisStatus = pc.green(`Connected (${cacheService.clientType === 'upstash' ? 'Upstash REST' : 'Redis TCP'})`);
  }

  // 5. Check Database
  let dbStatus = pc.yellow('Disconnected');
  if (process.env.DATABASE_URL) {
    try {
      await withDbRetry(() => db.$queryRaw`SELECT 1`);
      dbStatus = pc.green('PostgreSQL (Connected)');
    } catch (err) {
      dbStatus = pc.yellow('Reconnecting... (or Offline)');
    }
  } else {
    dbStatus = pc.yellow('Unconfigured (Offline Mode)');
  }

  // 6. Security & Misc
  const jwtStatus = process.env.JWT_SECRET ? pc.green('JWT Enabled') : pc.yellow('JWT Using Default Secret');
  const cacheStatus = cacheService.isAvailable ? pc.green('Enabled') : pc.yellow('Offline Fallback');
  const rateLimiterStatus = cacheService.isAvailable ? pc.green('Enabled') : pc.yellow('Offline Fallback');

  // 7. Print Banner
  console.log('\n' + pc.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(pc.bold(pc.white('🚀 Signal Board API')));
  console.log(pc.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  
  console.log(`${pc.blue('🌐 Environment')}          : ${env === 'production' ? pc.green(env) : pc.yellow(env)}`);
  console.log(`${pc.blue('📦 Version')}              : ${pc.white(version)}`);
  console.log(`${pc.blue('🖥️  Server')}              : ${pc.cyan(serverUrl)}`);
  console.log(`${pc.blue('🔌 Port')}                 : ${pc.white(port)}`);
  console.log(`${pc.blue('🤖 Primary AI Provider')}  : ${groqStatus}`);
  console.log(`${pc.blue('🧠 Secondary AI')}         : ${geminiStatus}`);
  console.log(`${pc.blue('🗄️  Redis')}               : ${redisStatus}`);
  console.log(`${pc.blue('🛢️  Database')}            : ${dbStatus}`);
  console.log(`${pc.blue('🔐 Authentication')}       : ${jwtStatus}`);
  console.log(`${pc.blue('⚡ Cache')}                : ${cacheStatus}`);
  console.log(`${pc.blue('🛡️  Rate Limiter')}        : ${rateLimiterStatus}`);
  console.log(`${pc.blue('🔍 Search Engine')}        : ${pc.green('Hybrid (AI + Heuristic)')}`);
  console.log(`${pc.blue('❤️  Health Check')}        : ${pc.cyan(`${serverUrl}/api/health`)}`);
  
  console.log(pc.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(pc.bold(pc.green('✅ Signal Board API is ready to accept requests.')));
  console.log(pc.cyan('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━') + '\n');
};
