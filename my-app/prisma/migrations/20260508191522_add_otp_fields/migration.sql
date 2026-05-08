-- AlterTable
ALTER TABLE "users" ADD COLUMN     "isVerified" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "otpExpiry" TIMESTAMP(3),
ADD COLUMN     "verifyOtp" TEXT;
