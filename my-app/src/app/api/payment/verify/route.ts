import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );

    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      bookingId,
    } = await req.json();

    if (
      !razorpay_order_id ||
      !razorpay_payment_id ||
      !razorpay_signature ||
      !bookingId
    ) {
      return NextResponse.json(
        { error: "Missing payment payload" },
        { status: 400 },
      );
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId: session.user.id },
    });

    if (!booking)
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );

    if (booking.paymentDeadline && new Date() > booking.paymentDeadline) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { bookingStatus: "EXPIRED" },
      });
      return NextResponse.json(
        { error: "Payment deadline expired. Booking cancelled." },
        { status: 400 },
      );
    }

    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) throw new Error("Razorpay secret missing");

    const generatedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generatedSignature !== razorpay_signature) {
      return NextResponse.json(
        { error: "Payment verification failed. Invalid signature." },
        { status: 400 },
      );
    }

    const confirmedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "CONFIRMED",
        paymentStatus: "PAID",
      },
    });

    return NextResponse.json(
      { message: "Payment verified successfully", booking: confirmedBooking },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("PAYMENT_VERIFY_ERR:", error);
    return NextResponse.json(
      { error: "Server error during verification" },
      { status: 500 },
    );
  }
}
