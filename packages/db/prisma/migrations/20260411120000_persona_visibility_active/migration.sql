-- CreateEnum
CREATE TYPE "PersonaVisibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "Persona" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "Persona" ADD COLUMN "visibility" "PersonaVisibility" NOT NULL DEFAULT 'PUBLIC';
