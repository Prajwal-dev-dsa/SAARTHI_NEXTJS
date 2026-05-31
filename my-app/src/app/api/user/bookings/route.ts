import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const bookings = await prisma.booking.findMany({
      where: { userId: session.user.id },
      include: {
        partner: { select: { name: true } },
        vehicle: { select: { model: true, vehicleNumber: true, type: true } },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ bookings }, { status: 200 });
  } catch (error) {
    console.error("USER_BOOKINGS_ERR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
