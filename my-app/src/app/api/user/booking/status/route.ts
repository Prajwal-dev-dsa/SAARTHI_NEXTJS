import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const bookingId = req.nextUrl.searchParams.get("id");
    if (!bookingId)
      return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId, userId: session.user.id },
      select: { bookingStatus: true },
    });

    if (!booking)
      return NextResponse.json({ error: "Not found" }, { status: 404 });

    return NextResponse.json(
      { status: booking.bookingStatus },
      { status: 200 },
    );
  } catch (error) {
    console.error("STATUS_POLL_ERR:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
