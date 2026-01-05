-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "autoDeleteAt" TIMESTAMP(3),
ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "Project_deletedAt_idx" ON "Project"("deletedAt");

-- CreateIndex
CREATE INDEX "Project_autoDeleteAt_idx" ON "Project"("autoDeleteAt");
