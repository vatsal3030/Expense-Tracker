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
import { healthRouter } from './routes/health.routes';

dotenv.config();

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

// Rate limiting - 100 requests per 15 minutes per IP
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
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

app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/users', userRouter);
app.use('/api/groups', groupRouter);
app.use('/api/expenses', expenseRouter);
app.use('/api/settlements', settlementRouter);
app.use('/api/budgets', budgetRouter);
app.use('/api/activities', activityRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/friends', friendRouter);

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

export default app;
