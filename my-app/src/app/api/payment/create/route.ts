import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );

    const { bookingId } = await req.json();
    if (!bookingId)
      return NextResponse.json(
        { error: "Booking ID is required." },
        { status: 400 },
      );

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId: session.user.id },
    });

    if (!booking)
      return NextResponse.json(
        { error: "Booking not found." },
        { status: 404 },
      );

    if (booking.bookingStatus !== "AWAITING_PAYMENT") {
      return NextResponse.json(
        { error: "This ride is not ready for payment." },
        { status: 400 },
      );
    }

    if (booking.paymentDeadline && new Date() > booking.paymentDeadline) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { bookingStatus: "EXPIRED" }, // Free up the driver!
      });
      return NextResponse.json(
        { error: "Payment deadline expired. Booking cancelled." },
        { status: 400 },
      );
    }

    const amountInPaise = Math.round(booking.fare * 100);

    const options = {
      amount: amountInPaise,
      currency: "INR",
      receipt: booking.id,
      notes: { bookingId: booking.id, userId: session.user.id },
    };

    const order = await razorpay.orders.create(options);

    if (!order || !order.id)
      throw new Error("Razorpay returned an invalid order.");

    return NextResponse.json(
      {
        message: "Order created successfully",
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("RAZORPAY_CREATE_ORDER_ERR:", error);
    return NextResponse.json(
      { error: "Failed to initialize payment gateway." },
      { status: 500 },
    );
  }
}
