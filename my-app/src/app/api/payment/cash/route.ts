import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

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
        { error: "This ride is not ready for confirmation." },
        { status: 400 },
      );
    }

    if (booking.paymentDeadline && new Date() > booking.paymentDeadline) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: { bookingStatus: "EXPIRED" }, // Free up the driver!
      });
      return NextResponse.json(
        { error: "Confirmation deadline expired. Booking cancelled." },
        { status: 400 },
      );
    }

    const confirmedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "CONFIRMED",
        paymentStatus: "CASH",
      },
    });

    return NextResponse.json(
      { message: "Ride confirmed with Cash.", booking: confirmedBooking },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("CASH_CONFIRM_ERR:", error);
    return NextResponse.json(
      { error: "Failed to confirm cash ride." },
      { status: 500 },
    );
  }
}
