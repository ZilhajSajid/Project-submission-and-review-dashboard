-- CreateEnum
CREATE TYPE "UserStatus" AS ENUM ('ACTIVE', 'BLOCKED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "useStatus" "UserStatus" NOT NULL DEFAULT 'ACTIVE';
