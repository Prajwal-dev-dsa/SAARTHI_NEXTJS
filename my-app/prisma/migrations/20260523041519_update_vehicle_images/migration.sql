/*
  Warnings:

  - You are about to drop the column `imageUrl` on the `vehicles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "vehicles" DROP COLUMN "imageUrl",
ADD COLUMN     "backImageUrl" TEXT,
ADD COLUMN     "frontImageUrl" TEXT,
ADD COLUMN     "leftImageUrl" TEXT,
ADD COLUMN     "rightImageUrl" TEXT;
