import 'dotenv/config';
import prisma from '../src/prismaClient';

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('DATABASE_URL is not defined. Cannot reset database.');
  process.exit(1);
}

async function reset() {
  console.log('Resetting database at', databaseUrl);

  await prisma.$transaction([
    prisma.comment.deleteMany(),
    prisma.document.deleteMany(),
    prisma.task.deleteMany(),
    prisma.organizationInvitation.deleteMany(),
    prisma.organizationMember.deleteMany(),
    prisma.sprint.deleteMany(),
    prisma.project.deleteMany(),
    prisma.organization.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log('Database reset complete.');
}

reset()
  .catch((err) => {
    console.error('Failed to reset database', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
