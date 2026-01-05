import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';
import sprintRoutes from './routes/sprints';
import organizationRoutes from './routes/organizations';
import { auth } from './middleware/auth';
import { verifyEmailConfig } from './utils/emailService';
import { verifyGeminiConfig } from './utils/geminiService';
import prisma from './prismaClient';
import { startProjectCleanupJob } from './jobs/projectCleanup';

dotenv.config();

const sentryDsn = process.env.SENTRY_BACKEND_DSN;
const parseSampleRate = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};
const app: Express = express();
const port = process.env.PORT || 5001;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: process.env.NODE_ENV || 'development',
    integrations: [
      Sentry.httpIntegration(),
      Sentry.expressIntegration(),
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: parseSampleRate(process.env.SENTRY_TRACES_SAMPLE_RATE, 0.2),
    profilesSampleRate: parseSampleRate(process.env.SENTRY_PROFILES_SAMPLE_RATE, 0),
    tracePropagationTargets: ['localhost', /^\//],
  });
}

// CORS configuration - restrict origins in production
const allowedOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, etc.)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
        return callback(null, true);
      }
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per window
  message: { message: 'Too many attempts, please try again after 15 minutes' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General rate limiting
const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: { message: 'Too many requests, please slow down' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(generalLimiter);
app.use(express.json());

app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/auth', authLimiter, authRoutes);
app.use('/documents', documentRoutes);
app.use('/comments', commentRoutes);
app.use('/users', userRoutes);
app.use('/sprints', sprintRoutes);
app.use('/organizations', organizationRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

// Sentry error handler must be before other error handlers
if (sentryDsn) {
  Sentry.setupExpressErrorHandler(app);
}

// Custom error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  if (res.headersSent) {
    return next(err);
  }
  console.error('Unhandled error:', err);
  
  // Capture error in Sentry if not already captured
  if (sentryDsn) {
    Sentry.captureException(err);
  }
  
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

async function start() {
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL is not defined in the environment');
    process.exit(1);
  }

  try {
    await prisma.$connect();
    console.log('PostgreSQL connection established successfully');
    verifyEmailConfig();
    verifyGeminiConfig();

    app.listen(port, () => {
      console.log(`Server is running on port: ${port}`);
    });
  } catch (error) {
    console.error('Failed to initialize application', error);
    if (sentryDsn) {
      Sentry.captureException(error);
      await Sentry.flush(2000);
    }
    process.exit(1);
  }
}

start();
startProjectCleanupJob();

const shutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

shutdownSignals.forEach((signal) => {
  process.on(signal, async () => {
    console.log(`Received shutdown signal: ${signal}`);
    if (sentryDsn) {
      Sentry.captureMessage(`Received shutdown signal: ${signal}`, 'info');
    }
    try {
      await prisma.$disconnect();
      console.log('Prisma disconnected successfully');
    } catch (error) {
      console.error('Error during Prisma disconnect:', error);
      if (sentryDsn) {
        Sentry.captureException(error);
      }
    } finally {
      if (sentryDsn) {
        await Sentry.flush(2000);
      }
      process.exit(0);
    }
  });
});

process.on('unhandledRejection', async (reason) => {
  console.error('Unhandled promise rejection:', reason);
  if (sentryDsn) {
    const error = reason instanceof Error ? reason : new Error(JSON.stringify(reason));
    Sentry.captureException(error, {
      tags: { type: 'unhandledRejection' },
    });
    await Sentry.flush(2000);
  }
});

process.on('uncaughtException', async (error) => {
  console.error('Uncaught exception:', error);
  if (sentryDsn) {
    Sentry.captureException(error, {
      tags: { type: 'uncaughtException' },
    });
    await Sentry.flush(2000);
  }
  process.exit(1);
});
