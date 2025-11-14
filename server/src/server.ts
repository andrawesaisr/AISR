import express, { Express, NextFunction, Request, Response } from 'express';
import cors from 'cors';
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
import prisma from './prismaClient';

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

app.use(cors({ origin: '*' }));
app.use(express.json());

app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/auth', authRoutes);
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
