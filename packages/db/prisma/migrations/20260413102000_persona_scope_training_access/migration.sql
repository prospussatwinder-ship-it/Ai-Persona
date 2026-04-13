-- CreateEnum
CREATE TYPE "PersonaAccessType" AS ENUM ('purchased', 'assigned', 'subscription', 'admin_granted');

-- CreateEnum
CREATE TYPE "UserPersonaAccessStatus" AS ENUM ('active', 'inactive', 'revoked');

-- CreateEnum
CREATE TYPE "UserPersonaTrainingStatus" AS ENUM ('active', 'archived');

-- AlterTable
ALTER TABLE "PersonaProfile"
ADD COLUMN "scopeName" TEXT,
ADD COLUMN "scopeDescription" TEXT,
ADD COLUMN "allowedTopics" JSONB,
ADD COLUMN "blockedTopics" JSONB,
ADD COLUMN "behaviorRules" TEXT,
ADD COLUMN "feedData" JSONB;

-- AlterTable
ALTER TABLE "MemoryEntry"
ADD COLUMN "memoryKey" TEXT,
ADD COLUMN "memoryType" TEXT,
ADD COLUMN "confidenceScore" DOUBLE PRECISION,
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "UserPersonaAccess" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "accessType" "PersonaAccessType" NOT NULL,
    "status" "UserPersonaAccessStatus" NOT NULL DEFAULT 'active',
    "startDate" TIMESTAMP(3),
    "endDate" TIMESTAMP(3),
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPersonaAccess_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserPersonaTrainingProfile" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "personaId" TEXT NOT NULL,
    "title" TEXT,
    "trainingNotes" TEXT,
    "structuredProfile" JSONB,
    "status" "UserPersonaTrainingStatus" NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserPersonaTrainingProfile_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "MemoryEntry_userId_personaId_memoryKey_idx" ON "MemoryEntry"("userId", "personaId", "memoryKey");

-- CreateIndex
CREATE UNIQUE INDEX "UserPersonaAccess_userId_personaId_accessType_key" ON "UserPersonaAccess"("userId", "personaId", "accessType");

-- CreateIndex
CREATE INDEX "UserPersonaAccess_userId_status_idx" ON "UserPersonaAccess"("userId", "status");

-- CreateIndex
CREATE INDEX "UserPersonaAccess_personaId_status_idx" ON "UserPersonaAccess"("personaId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "UserPersonaTrainingProfile_userId_personaId_key" ON "UserPersonaTrainingProfile"("userId", "personaId");

-- CreateIndex
CREATE INDEX "UserPersonaTrainingProfile_userId_status_idx" ON "UserPersonaTrainingProfile"("userId", "status");

-- CreateIndex
CREATE INDEX "UserPersonaTrainingProfile_personaId_status_idx" ON "UserPersonaTrainingProfile"("personaId", "status");

-- AddForeignKey
ALTER TABLE "UserPersonaAccess" ADD CONSTRAINT "UserPersonaAccess_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPersonaAccess" ADD CONSTRAINT "UserPersonaAccess_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPersonaTrainingProfile" ADD CONSTRAINT "UserPersonaTrainingProfile_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserPersonaTrainingProfile" ADD CONSTRAINT "UserPersonaTrainingProfile_personaId_fkey" FOREIGN KEY ("personaId") REFERENCES "Persona"("id") ON DELETE CASCADE ON UPDATE CASCADE;
