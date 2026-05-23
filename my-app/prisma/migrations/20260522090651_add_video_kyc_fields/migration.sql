/*
  Warnings:

  - A unique constraint covering the columns `[videoKycRoomId]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "VideoKycStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "videoKycRejectReason" TEXT,
ADD COLUMN     "videoKycRoomId" TEXT,
ADD COLUMN     "videoKycStatus" "VideoKycStatus" NOT NULL DEFAULT 'NOT_REQUIRED';

-- CreateIndex
CREATE UNIQUE INDEX "users_videoKycRoomId_key" ON "users"("videoKycRoomId");
