import { betterAuth } from 'better-auth';
import Database from 'better-sqlite3';

let authInstance: ReturnType<typeof betterAuth> | null = null;

/**
 * Initialize Better Auth with the database
 */
export function initializeAuth(dbPath: string) {
  const db = new Database(dbPath);

  authInstance = betterAuth({
    database: {
      db,
      type: 'sqlite',
    },
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // Disable for MVP, enable in production
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day - update session if older than this
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 minutes
      },
    },
    trustedOrigins: [
      'http://localhost:3000',
      'http://localhost:3002',
      'http://localhost:3003',
      'https://openfacilitator.io',
    ],
  });

  return authInstance;
}

/**
 * Get the auth instance
 */
export function getAuth() {
  if (!authInstance) {
    throw new Error('Auth not initialized. Call initializeAuth() first.');
  }
  return authInstance;
}

export { authInstance as auth };

