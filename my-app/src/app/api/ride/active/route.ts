import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookingId = req.nextUrl.searchParams.get("id");
    if (!bookingId)
      return NextResponse.json(
        { error: "Booking ID missing" },
        { status: 400 },
      );

    // Fetch the booking and include the relationships
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true, phone: true, location: true } },
        partner: {
          select: { id: true, name: true, phone: true, location: true },
        },
        vehicle: { select: { type: true, model: true, vehicleNumber: true } },
      },
    });

    if (!booking)
      return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    // Ensure the person requesting is either the Rider or the Driver
    if (
      booking.userId !== session.user.id &&
      booking.partnerId !== session.user.id
    ) {
      return NextResponse.json(
        { error: "Forbidden access to this ride." },
        { status: 403 },
      );
    }

    return NextResponse.json({ booking }, { status: 200 });
  } catch (error) {
    console.error("FETCH_ACTIVE_RIDE_ERR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
