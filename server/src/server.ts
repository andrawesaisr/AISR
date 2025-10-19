import express, { Express, Request, Response } from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import projectRoutes from './routes/projects';
import taskRoutes from './routes/tasks';
import authRoutes from './routes/auth';
import documentRoutes from './routes/documents';
import boardRoutes from './routes/boards';
import commentRoutes from './routes/comments';
import userRoutes from './routes/users';
import sprintRoutes from './routes/sprints';
import organizationRoutes from './routes/organizations';
import { auth } from './middleware/auth';
import { verifyEmailConfig } from './utils/emailService';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5001;

app.use(cors({ origin: '*' }));
app.use(express.json());

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("MONGODB_URI is not defined in the .env file");
  process.exit(1);
}

mongoose.connect(uri)
  .then(() => {
    console.log("MongoDB database connection established successfully");
    verifyEmailConfig();
  })
  .catch(err => console.log(err));

app.use('/projects', projectRoutes);
app.use('/tasks', taskRoutes);
app.use('/auth', authRoutes);
app.use('/documents', documentRoutes);
app.use('/boards', boardRoutes);
app.use('/comments', commentRoutes);
app.use('/users', userRoutes);
app.use('/sprints', sprintRoutes);
app.use('/organizations', organizationRoutes);

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
});
