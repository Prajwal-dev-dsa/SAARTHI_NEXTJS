import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { bookingId } = await req.json();
    if (!bookingId)
      return NextResponse.json(
        { error: "Booking ID missing" },
        { status: 400 },
      );

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId, userId: session.user.id },
      data: { bookingStatus: "CANCELLED" },
    });

    return NextResponse.json(
      { message: "Booking cancelled", booking: updatedBooking },
      { status: 200 },
    );
  } catch (error) {
    console.error("CANCEL_BOOKING_ERR:", error);
    return NextResponse.json(
      { error: "Failed to cancel booking" },
      { status: 500 },
    );
  }
}
