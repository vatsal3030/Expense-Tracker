import express, { Express, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import http from 'http';
import dotenv from 'dotenv';
import { errorHandler, notFoundHandler } from '../middleware/errorHandler';
import prisma from '../lib/prisma';

dotenv.config();

// =============================================================================
// REQUIRED ENV VALIDATION
// =============================================================================
const REQUIRED_ENV = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ FATAL [Microservice Boot]: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

export interface MicroserviceOptions {
  serviceName: string;
  defaultPort: number;
  routes: Array<{ path: string; router: Router }>;
  setupCustom?: (app: Express, server: http.Server) => void;
}

export function createMicroservice(options: MicroserviceOptions): { app: Express; server: http.Server } {
  const { serviceName, defaultPort, routes, setupCustom } = options;
  const app = express();
  const port = process.env.PORT || defaultPort;

  // 1. Security & Core Middleware
  app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
  app.use(
    cors({
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'idempotency-key',
        'Idempotency-Key',
        'x-client-version',
        'x-requested-with',
        'Accept',
      ],
    })
  );

  // 2. Health check endpoint
  app.get(['/health', '/api/health', `/${serviceName}/health`], (_req, res) => {
    res.status(200).json({
      status: 'UP',
      service: serviceName,
      port: Number(port),
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      architecture: 'microservices',
    });
  });

  // 3. Rate limiting
  const isDev = process.env.NODE_ENV !== 'production';
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: isDev ? 10000 : 2500,
    standardHeaders: true,
    legacyHeaders: false,
    skip: (req) => req.method === 'OPTIONS',
    message: { error: 'Too many requests, please try again later.' },
  });
  app.use('/api/', limiter);

  // 4. Utility Middleware
  app.use(compression());
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

  // 5. Mount Domain Routes
  for (const { path, router } of routes) {
    app.use(path, router);
  }

  // 6. Error Handlers
  app.use(notFoundHandler);
  app.use(errorHandler);

  // 7. Create HTTP Server
  const server = http.createServer(app);

  if (setupCustom) {
    setupCustom(app, server);
  }

  // 8. Start Listening
  server.listen(port, () => {
    console.log(`
    ╔══════════════════════════════════════════════════════╗
    ║   🚀 [Microservice: ${serviceName.padEnd(20)}]     ║
    ║   Port: ${String(port).padEnd(41)}║
    ║   Health: http://localhost:${String(port)}/health${''.padEnd(16)}║
    ║   Environment: ${(process.env.NODE_ENV || 'development').padEnd(34)}║
    ╚══════════════════════════════════════════════════════╝
    `);
  });

  // 9. Graceful Shutdown
  const gracefulShutdown = async (signal: string) => {
    console.log(`\n🛑 [${serviceName}] Received ${signal}, closing connections gracefully...`);
    server.close(async () => {
      try {
        await prisma.$disconnect();
        console.log(`✅ [${serviceName}] Database connections closed. Process terminating.`);
        process.exit(0);
      } catch (err) {
        console.error(`❌ [${serviceName}] Error during disconnect:`, err);
        process.exit(1);
      }
    });

    setTimeout(() => {
      console.error(`⏰ [${serviceName}] Force shutdown after 10s timeout`);
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return { app, server };
}
