import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { sendRideOtpEmail } from "@/lib/mail";

const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "PARTNER")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookingId, type } = await req.json(); // type is "PICKUP" or "DROP"
    const otp = generateOTP();
    const expiry = new Date(Date.now() + 15 * 60 * 1000);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { user: true },
    });

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Update DB
    if (type === "PICKUP") {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { pickUpOtp: otp, pickupOtpExpire: expiry },
      });
    } else {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { dropOtp: otp, dropOtpExpire: expiry },
      });
    }

    // Send Mail to User
    await sendRideOtpEmail(booking.user.email, otp, type);
    return NextResponse.json({ message: "OTP Sent to User" }, { status: 200 });
  } catch (error) {
    console.error("SEND_OTP_ERR:", error);
    return NextResponse.json({ error: "Failed to send OTP" }, { status: 500 });
  }
}
