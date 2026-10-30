export const env = {
  SESSION_PASSWORD: process.env.SESSION_PASSWORD || 'development-secret-change-in-production',
  BRAVE_API_KEY: process.env.BRAVE_API_KEY || '',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || '',
  ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || '',
  SYNC_ENCRYPTION_KEY: process.env.SYNC_ENCRYPTION_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || '',
  REDIS_URL: process.env.REDIS_URL || '',
  VERCEL_URL: process.env.VERCEL_URL || 'http://localhost:3000',
  NODE_ENV: process.env.NODE_ENV || 'development',
};

export const isProduction = env.NODE_ENV === 'production';
export const isDevelopment = env.NODE_ENV === 'development';