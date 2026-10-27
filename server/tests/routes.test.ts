import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'http';
import express from 'express';
import { recurringRouter } from '../src/routes/recurring.routes';
import { fxRouter } from '../src/routes/fx.routes';
import { adminRouter } from '../src/routes/admin.routes';
import { healthRouter } from '../src/routes/health.routes';
import { notFoundHandler, errorHandler } from '../src/middleware/errorHandler';

describe('Regression Tests: Previously Missing NGINX Route Prefixes', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    const app = express();
    app.use(express.json());

    // Mount health and previously missing route prefixes
    app.use('/api/health', healthRouter);
    app.use('/api/recurring', recurringRouter);
    app.use('/api/fx', fxRouter);
    app.use('/api/admin', adminRouter);

    // Error handlers
    app.use(notFoundHandler);
    app.use(errorHandler);

    // Listen on dynamic ephemeral port
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

  it('1. /api/health should respond with status 200 and healthy JSON', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    const json = await res.json() as { status: string };
    assert.equal(json.status, 'healthy');
  });

  it('2. /api/recurring should be registered and return 401 without auth token', async () => {
    const res = await fetch(`${baseUrl}/api/recurring`);
    assert.equal(res.status, 401);
    const json = await res.json() as { error?: string; message?: string };
    assert.ok(json.error || json.message, 'Expected error response payload');
  });

  it('3. /api/fx should be registered and return 401 without auth token', async () => {
    const res = await fetch(`${baseUrl}/api/fx/rates`);
    assert.equal(res.status, 401);
    const json = await res.json() as { error?: string; message?: string };
    assert.ok(json.error || json.message, 'Expected error response payload');
  });

  it('4. /api/admin should be registered and return 401 without auth token', async () => {
    const res = await fetch(`${baseUrl}/api/admin/metrics`);
    assert.equal(res.status, 401);
    const json = await res.json() as { error?: string; message?: string };
    assert.ok(json.error || json.message, 'Expected error response payload');
  });

  it('5. Unregistered /api/* route should return 404 JSON', async () => {
    const res = await fetch(`${baseUrl}/api/non_existent_endpoint`);
    assert.equal(res.status, 404);
    const json = await res.json() as { error: string };
    assert.ok(json.error && json.error.toLowerCase().includes('not found'));
  });
});
