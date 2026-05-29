-- AlterEnum
ALTER TYPE "BookingStatus" ADD VALUE 'IDLE';

-- AlterTable
ALTER TABLE "bookings" ALTER COLUMN "bookingStatus" SET DEFAULT 'IDLE';
