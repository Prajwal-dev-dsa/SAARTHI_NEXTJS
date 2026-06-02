import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId, type, otp } = await req.json();

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });
    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    if (type === "PICKUP") {
      if (booking.pickUpOtp !== otp)
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      if (booking.pickupOtpExpire && booking.pickupOtpExpire < new Date())
        return NextResponse.json({ error: "OTP Expired" }, { status: 400 });

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          bookingStatus: "STARTED",
          pickUpOtp: null,
          pickupOtpExpire: null,
        },
      });
    } else {
      if (booking.dropOtp !== otp)
        return NextResponse.json({ error: "Invalid OTP" }, { status: 400 });
      if (booking.dropOtpExpire && booking.dropOtpExpire < new Date())
        return NextResponse.json({ error: "OTP Expired" }, { status: 400 });

      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          bookingStatus: "COMPLETED",
          dropOtp: null,
          dropOtpExpire: null,
          paymentStatus: "PAID",
        },
      });
    }

    return NextResponse.json(
      { message: "Verified successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("VERIFY_OTP_ERR:", error);
    return NextResponse.json(
      { error: "Failed to verify OTP" },
      { status: 500 },
    );
  }
}
