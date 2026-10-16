import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { authRouter } from './routes/auth.routes';
import { userRouter } from './routes/user.routes';
import { groupRouter } from './routes/group.routes';
import { expenseRouter } from './routes/expense.routes';
import { settlementRouter } from './routes/settlement.routes';
import { budgetRouter } from './routes/budget.routes';
import { activityRouter } from './routes/activity.routes';
import { dashboardRouter } from './routes/dashboard.routes';
import { friendRouter } from './routes/friend.routes';
import { notificationRouter } from './routes/notification.routes';
import { healthRouter } from './routes/health.routes';
import { adminRouter } from './routes/admin.routes';

dotenv.config();

// =============================================================================
// REQUIRED ENV VALIDATION — fail fast if critical secrets are missing
// =============================================================================
const REQUIRED_ENV = ['DATABASE_URL', 'SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`❌ FATAL: Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// =============================================================================
// SECURITY MIDDLEWARE
// =============================================================================

app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Unthrottled health check
app.use('/api/health', healthRouter);

// Rate limiting - Relaxed in dev to prevent 429 during active development/HMR, 2500 in prod
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

// =============================================================================
// GENERAL MIDDLEWARE
// =============================================================================

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// =============================================================================
// ROUTES
// =============================================================================
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/groups', groupRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/settlements', settlementRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/activities', activityRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/friends', friendRouter);
app.use('/api/notifications', notificationRouter);
app.use('/api/admin', adminRouter);

// =============================================================================
// ERROR HANDLING
// =============================================================================

app.use(notFoundHandler);
app.use(errorHandler);

// =============================================================================
// SERVER START
// =============================================================================

app.listen(PORT, () => {
  console.log(`
  ╔═══════════════════════════════════════════════╗
  ║                                               ║
  ║   🚀 FairShare API Server                     ║
  ║   Running on port ${PORT}                        ║
  ║   Environment: ${process.env.NODE_ENV || 'development'}               ║
  ║                                               ║
  ╚═══════════════════════════════════════════════╝
  `);
});

// =============================================================================
// GRACEFUL SHUTDOWN — drain Prisma connections on Docker/K8s stop signals
// =============================================================================
import prisma from './lib/prisma';

const gracefulShutdown = async (signal: string) => {
  console.log(`\n🛑 Received ${signal}. Shutting down gracefully...`);
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
