import { createMiddleware } from 'hono/factory';
import { cors } from 'hono/cors';
import { rateLimiter } from 'hono-rate-limiter';
import { getIronSession } from 'iron-session/edge';
import { env } from '@/env';

export const sessionMiddleware = createMiddleware(async (c, next) => {
  const session = await getIronSession(c.req.raw, {
    cookieName: 'xyro_session',
    password: env.SESSION_PASSWORD,
    cookieOptions: {
      secure: true,
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30,
    },
  });
  
  c.set('session', session);
  await next();
});

export const corsMiddleware = cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  maxAge: 86400,
});

export const rateLimitMiddleware = rateLimiter({
  windowMs: 60 * 1000,
  limit: 100,
  keyGenerator: (c) => c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'anonymous',
  standardHeaders: true,
  legacyHeaders: false,
});

export const securityHeadersMiddleware = createMiddleware(async (c, next) => {
  await next();
  c.res.headers.set('X-Content-Type-Options', 'nosniff');
  c.res.headers.set('X-Frame-Options', 'DENY');
  c.res.headers.set('X-XSS-Protection', '1; mode=block');
  c.res.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  c.res.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=(), interest-cohort=()');
  c.res.headers.set('Content-Security-Policy', "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' https: wss:;");
});

export const authMiddleware = createMiddleware(async (c, next) => {
  const session = c.get('session');
  if (!session.userId && c.req.path.startsWith('/api/protected')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }
  await next();
});