-- CreateEnum
CREATE TYPE "BookingStatus" AS ENUM ('REQUESTED', 'AWAITING_PAYMENT', 'CONFIRMED', 'STARTED', 'COMPLETED', 'CANCELLED', 'REJECTED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PAID', 'CASH', 'FAILED');

-- CreateTable
CREATE TABLE "bookings" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "partnerId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "pickUpAddress" TEXT NOT NULL,
    "dropAddress" TEXT NOT NULL,
    "pickUpLocation" JSONB NOT NULL,
    "dropLocation" JSONB NOT NULL,
    "fare" DOUBLE PRECISION NOT NULL,
    "adminComission" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "partnerAmount" DOUBLE PRECISION NOT NULL DEFAULT 0.0,
    "userMobileNumber" TEXT NOT NULL,
    "partnerMobileNumber" TEXT NOT NULL,
    "bookingStatus" "BookingStatus" NOT NULL DEFAULT 'REQUESTED',
    "paymentStatus" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "pickUpOtp" TEXT,
    "pickupOtpExpire" TIMESTAMP(3),
    "dropOtp" TEXT,
    "dropOtpExpire" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bookings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "bookings_userId_idx" ON "bookings"("userId");

-- CreateIndex
CREATE INDEX "bookings_partnerId_idx" ON "bookings"("partnerId");

-- CreateIndex
CREATE INDEX "bookings_bookingStatus_idx" ON "bookings"("bookingStatus");

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "bookings" ADD CONSTRAINT "bookings_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "vehicles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
