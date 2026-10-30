import { CookieJar } from 'tough-cookie';

interface SessionJarEntry {
  jar: CookieJar;
  lastAccess: number;
}

const MAX_JARS = 500;
const sessionJars = new Map<string, SessionJarEntry>();

/**
 * Gets or creates a CookieJar for a given session ID.
 */
export function getCookieJar(sessionId: string): CookieJar {
  const now = Date.now();
  let entry = sessionJars.get(sessionId);

  if (entry) {
    entry.lastAccess = now;
    return entry.jar;
  }

  // Enforce LRU eviction if max size reached
  if (sessionJars.size >= MAX_JARS) {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;
    for (const [key, val] of sessionJars.entries()) {
      if (val.lastAccess < oldestTime) {
        oldestTime = val.lastAccess;
        oldestKey = key;
      }
    }
    if (oldestKey) {
      sessionJars.delete(oldestKey);
    }
  }

  const jar = new CookieJar();
  sessionJars.set(sessionId, { jar, lastAccess: now });
  return jar;
}

/**
 * Clears cookies for a given session or all sessions.
 */
export function clearCookieJar(sessionId?: string): void {
  if (sessionId) {
    sessionJars.delete(sessionId);
  } else {
    sessionJars.clear();
  }
}
