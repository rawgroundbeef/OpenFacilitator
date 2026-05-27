import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from './server.js';
import { initializeDatabase } from './db/index.js';
import { initializeAuth } from './auth/index.js';
import type { Express } from 'express';
import fs from 'fs';

describe('Auth Routes', () => {
  let app: Express;
  const testDbPath = './data/test-openfacilitator.db';

  beforeAll(async () => {
    // Use test database
    process.env.DATABASE_PATH = testDbPath;
    process.env.BETTER_AUTH_SECRET = 'test-secret-for-testing-only';
    process.env.BETTER_AUTH_URL = 'http://localhost:5002';

    await initializeDatabase(testDbPath);
    initializeAuth(testDbPath);
    app = createServer();
  });

  afterAll(() => {
    // Clean up test database
    if (fs.existsSync(testDbPath)) {
      fs.unlinkSync(testDbPath);
    }
  });

  it('POST /api/auth/sign-up/email should not return 404', async () => {
    const response = await request(app)
      .post('/api/auth/sign-up/email')
      .send({
        email: 'test@example.com',
        password: 'testpassword123',
        name: 'Test User',
      })
      .set('Content-Type', 'application/json');

    // Should not be 404 - the route should be found
    // It might return 200 (success) or 400 (validation error) or other, but NOT 404
    expect(response.status).not.toBe(404);
  });

  it('scopes auth cookies to API paths without session data cache cookies', async () => {
    const response = await request(app)
      .post('/api/auth/sign-up/email')
      .send({
        email: `cookie-${Date.now()}@example.com`,
        password: 'testpassword123',
        name: 'Cookie Test User',
      })
      .set('Content-Type', 'application/json');

    const setCookies = response.headers['set-cookie'] ?? [];
    const cookies = Array.isArray(setCookies) ? setCookies : [setCookies];
    const sessionTokenCookie = cookies.find((cookie) => cookie.startsWith('better-auth.session_token='));

    expect(response.status).toBeLessThan(500);
    expect(sessionTokenCookie).toContain('Path=/api');
    expect(cookies.some((cookie) => cookie.startsWith('better-auth.session_data='))).toBe(false);
  });

  it('POST /api/auth/sign-in/email should not return 404', async () => {
    const response = await request(app)
      .post('/api/auth/sign-in/email')
      .send({
        email: 'test@example.com',
        password: 'testpassword123',
      })
      .set('Content-Type', 'application/json');

    expect(response.status).not.toBe(404);
  });

  it('GET /api/auth/get-session should not return 404', async () => {
    const response = await request(app)
      .get('/api/auth/get-session');

    expect(response.status).not.toBe(404);
  });

  it('POST /api/auth/sign-out should not return 404', async () => {
    const response = await request(app)
      .post('/api/auth/sign-out');

    expect(response.status).not.toBe(404);
  });
});

describe('Health Check', () => {
  let app: Express;

  beforeAll(() => {
    app = createServer();
  });

  it('GET /health should return 200', async () => {
    const response = await request(app).get('/health');
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
  });

  it('expires legacy Better Auth session data cookies', async () => {
    const response = await request(app)
      .get('/health')
      .set('Cookie', [
        'better-auth.session_data=abc',
        'better-auth.session_data.0=def',
        'better-auth.session_token=small',
      ].join('; '));

    const setCookies = response.headers['set-cookie'] ?? [];
    const cookies = Array.isArray(setCookies) ? setCookies : [setCookies];

    expect(cookies.some((cookie) => cookie.startsWith('better-auth.session_data=;'))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('better-auth.session_data.0=;'))).toBe(true);
    expect(cookies.some((cookie) => cookie.startsWith('better-auth.session_token=;'))).toBe(false);
  });
});

describe('Removed refund routes', () => {
  let app: Express;

  beforeAll(() => {
    app = createServer();
  });

  it.each([
    ['post', '/claims/report-failure'],
    ['get', '/api/claims?wallet=0x123'],
    ['get', '/api/claims/history?wallet=0x123'],
    ['post', '/api/claims/claim-id/execute'],
    ['get', '/api/resource-owners/me'],
    ['post', '/api/resource-owners/register'],
    ['get', '/api/resource-owners/resource-owner-id/wallets'],
    ['post', '/api/resource-owners/resource-owner-id/wallets'],
    ['delete', '/api/resource-owners/resource-owner-id/wallets/base'],
    ['get', '/api/resource-owners/resource-owner-id/servers'],
    ['post', '/api/resource-owners/resource-owner-id/servers'],
    ['patch', '/api/resource-owners/resource-owner-id/servers/server-id'],
    ['delete', '/api/resource-owners/resource-owner-id/servers/server-id'],
    ['get', '/api/resource-owners/resource-owner-id/claims'],
    ['post', '/api/resource-owners/resource-owner-id/claims/claim-id/approve'],
    ['post', '/api/resource-owners/resource-owner-id/claims/claim-id/reject'],
    ['post', '/api/resource-owners/resource-owner-id/claims/claim-id/payout'],
    ['get', '/api/admin/facilitators/facilitator-id/refunds/config'],
    ['post', '/api/admin/facilitators/facilitator-id/refunds/config'],
    ['get', '/api/admin/facilitators/facilitator-id/refunds/overview'],
    ['get', '/api/admin/facilitators/facilitator-id/resource-owners'],
    ['get', '/api/admin/facilitators/facilitator-id/resource-owners/resource-owner-id'],
  ] as const)('%s %s returns 410', async (method, path) => {
    const response = await request(app)[method](path);

    expect(response.status).toBe(410);
    expect(response.body.error).toBe('Refund functionality has been removed');
  });

  it('reports the public endpoint as not refund capable', async () => {
    const response = await request(app).get('/api/verify?facilitator=pay');

    expect(response.status).toBe(200);
    expect(response.body.supportsRefunds).toBe(false);
    expect(response.body.badgeUrl).toBeNull();
  });
});
