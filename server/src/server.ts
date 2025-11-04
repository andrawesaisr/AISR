import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
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

const app: Express = express();
const port = process.env.PORT || 5001;

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
    process.exit(1);
  }
}

start();

const shutdownSignals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM'];

shutdownSignals.forEach((signal) => {
  process.on(signal, async () => {
    try {
      await prisma.$disconnect();
    } catch (error) {
      console.error('Error during Prisma disconnect', error);
    } finally {
      process.exit(0);
    }
  });
});
