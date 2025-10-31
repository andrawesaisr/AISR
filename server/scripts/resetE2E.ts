import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Document from '../src/models/Document';
import Project from '../src/models/Project';
import Task from '../src/models/Task';
import Organization from '../src/models/Organization';
import User from '../src/models/User';

dotenv.config();

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aisr_e2e';

async function reset() {
  await mongoose.connect(uri);
  await Promise.all([
    Document.deleteMany({}),
    Project.deleteMany({}),
    Task.deleteMany({}),
    Organization.deleteMany({}),
    User.deleteMany({}),
  ]);
  await mongoose.disconnect();
  console.log('E2E database cleared at', uri);
}

reset().catch((err) => {
  console.error('Failed to reset E2E database', err);
  process.exit(1);
});
