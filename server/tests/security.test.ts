import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import express from 'express';
import { authRouter } from '../src/routes/auth.routes';
import { fxRouter } from '../src/routes/fx.routes';
import { adminRouter } from '../src/routes/admin.routes';
import { recurringRouter } from '../src/routes/recurring.routes';
import { notFoundHandler, errorHandler } from '../src/middleware/errorHandler';

describe('Security Suite: Hardened Endpoints & Authorization Rules', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    const app = express();
    app.use(express.json());

    app.use('/api/auth', authRouter);
    app.use('/api/fx', fxRouter);
    app.use('/api/admin', adminRouter);
    app.use('/api/recurring', recurringRouter);

    app.use(notFoundHandler);
    app.use(errorHandler);

    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as { port: number };
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it('1. /api/auth/login rejects malformed payload with 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'not-an-email' }),
    });
    assert.equal(res.status, 400);
    const json = await res.json() as { success: boolean };
    assert.equal(json.success, false);
  });

  it('2. /api/auth/signup rejects short passwords with 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: '123', name: 'Test' }),
    });
    assert.equal(res.status, 400);
    const json = await res.json() as { success: boolean };
    assert.equal(json.success, false);
  });

  it('3. /api/admin rejects unauthenticated requests with 401', async () => {
    const res = await fetch(`${baseUrl}/api/admin/overview`);
    assert.equal(res.status, 401);
  });

  it('4. /api/recurring/process rejects unauthorized requests without CRON secret', async () => {
    const res = await fetch(`${baseUrl}/api/recurring/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(res.status, 401);
  });
});
