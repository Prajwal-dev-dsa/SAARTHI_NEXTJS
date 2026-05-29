import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Only Partners receive ride requests
    if (session.user.role !== "PARTNER") {
      return NextResponse.json({ count: 0 }, { status: 200 });
    }

    // Count all bookings assigned to this partner that are currently sitting in 'REQUESTED' state
    const count = await prisma.booking.count({
      where: {
        partnerId: session.user.id,
        bookingStatus: "REQUESTED",
      },
    });

    return NextResponse.json({ count }, { status: 200 });
  } catch (error) {
    console.error("PENDING_COUNT_ERR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
