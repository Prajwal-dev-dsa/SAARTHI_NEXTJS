import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { bookingId } = await req.json();
    if (!bookingId)
      return NextResponse.json(
        { error: "Booking ID missing" },
        { status: 400 },
      );

    // 5 Minutes from now
    const deadline = new Date(Date.now() + 5 * 60 * 1000);

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingStatus: "AWAITING_PAYMENT",
        paymentDeadline: deadline,
      },
    });

    return NextResponse.json(
      { message: "Ride accepted. Awaiting payment.", booking: updatedBooking },
      { status: 200 },
    );
  } catch (error) {
    console.error("ACCEPT_RIDE_ERR:", error);
    return NextResponse.json(
      { error: "Failed to accept ride" },
      { status: 500 },
    );
  }
}
