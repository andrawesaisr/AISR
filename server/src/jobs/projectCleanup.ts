import cron from 'node-cron';
import prisma from '../prismaClient';

const DEFAULT_CRON_SCHEDULE = '0 3 * * *'; // 03:00 UTC daily
const PROJECT_AUTO_DELETE_MS = 14 * 24 * 60 * 60 * 1000;

const resolveSchedule = () => process.env.PROJECT_AUTO_DELETE_CRON ?? DEFAULT_CRON_SCHEDULE;

export const calculateAutoDeleteAt = (baseDate: Date = new Date()) =>
  new Date(baseDate.getTime() + PROJECT_AUTO_DELETE_MS);

export const startProjectCleanupJob = () => {
  if (process.env.PROJECT_AUTO_DELETE_ENABLED === 'false') {
    console.log('[ProjectCleanup] Skipping project cleanup job (disabled via environment flag)');
    return;
  }

  const schedule = resolveSchedule();

  cron.schedule(
    schedule,
    async () => {
      const now = new Date();
      const cutoff = new Date(now.getTime() - PROJECT_AUTO_DELETE_MS);

      try {
        const result = await prisma.project.updateMany({
          where: {
            deletedAt: null,
            OR: [
              {
                autoDeleteAt: {
                  lte: now,
                },
              },
              {
                autoDeleteAt: null,
                createdAt: {
                  lte: cutoff,
                },
              },
            ],
          },
          data: {
            deletedAt: now,
          },
        });

        if (result.count > 0) {
          console.log(
            `[ProjectCleanup] Soft-deleted ${result.count} project(s) at ${now.toISOString()}`
          );
        }
      } catch (error) {
        console.error('[ProjectCleanup] Failed to process scheduled deletions', error);
      }
    },
    {
      timezone: process.env.PROJECT_AUTO_DELETE_TZ ?? 'UTC',
    }
  );
};
