import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const activeBooking = await prisma.booking.findFirst({
      where: {
        userId: session.user.id,
        bookingStatus: {
          in: ["REQUESTED", "AWAITING_PAYMENT", "CONFIRMED", "STARTED"],
        },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(
      { booking: activeBooking || null },
      { status: 200 },
    );
  } catch (error) {
    console.error("CURRENT_BOOKING_ERR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
