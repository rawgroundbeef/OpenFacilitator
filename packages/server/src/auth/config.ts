import { betterAuth, type BetterAuthOptions } from 'better-auth';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { generateWalletForUser } from '../services/wallet.js';

export const DEFAULT_AUTH_DB_PATH = './data/openfacilitator.db';
export const AUTH_COOKIE_PATH = '/api';

export function resolveAuthDbPath(dbPath?: string): string {
  return dbPath || process.env.DATABASE_PATH || DEFAULT_AUTH_DB_PATH;
}

// Get trusted origins from environment and defaults
function getTrustedOrigins(): string[] {
  const dashboardUrl = process.env.DASHBOARD_URL;
  const additionalOrigins = process.env.ADDITIONAL_TRUSTED_ORIGINS;

  const origins = [
    // Development
    'http://localhost:3000',
    'http://localhost:3002',
    'http://localhost:5001',
    // Production (OpenFacilitator hosted)
    'https://openfacilitator.io',
    'https://www.openfacilitator.io',
    'https://dashboard.openfacilitator.io',
    'https://openfacilitator-dashboard.vercel.app',
    'https://api.openfacilitator.io',
  ];

  // Add custom dashboard URL if provided
  if (dashboardUrl && !origins.includes(dashboardUrl)) {
    origins.push(dashboardUrl);
  }

  // Add any additional trusted origins (comma-separated)
  if (additionalOrigins) {
    const extraOrigins = additionalOrigins.split(',').map(o => o.trim()).filter(Boolean);
    for (const origin of extraOrigins) {
      if (!origins.includes(origin)) {
        origins.push(origin);
      }
    }
  }

  return origins;
}

function createDatabaseConnection(dbPath: string): any {
  const dir = path.dirname(dbPath);
  if (dir !== '.') {
    fs.mkdirSync(dir, { recursive: true });
  }

  return new Database(dbPath);
}

export function createAuth(dbPath?: string) {
  const db = createDatabaseConnection(resolveAuthDbPath(dbPath));

  const authOptions = {
    database: db,
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:5002',
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: false,
      },
    },
    advanced: {
      defaultCookieAttributes: {
        path: AUTH_COOKIE_PATH,
      },
    },
    trustedOrigins: getTrustedOrigins(),
    databaseHooks: {
      user: {
        create: {
          after: async (user) => {
            // Auto-generate billing wallet for new users
            try {
              await generateWalletForUser(user.id);
              console.log(`Created billing wallet for user ${user.id}`);
            } catch (error) {
              // Don't fail signup if wallet creation fails
              // User can create wallet later via API
              console.error(`Failed to create wallet for user ${user.id}:`, error);
            }
          },
        },
      },
    },
  } satisfies BetterAuthOptions;

  return betterAuth(authOptions);
}

export type AuthInstance = ReturnType<typeof createAuth>;

export default createAuth;
