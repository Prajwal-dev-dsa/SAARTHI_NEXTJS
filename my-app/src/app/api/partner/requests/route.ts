import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const requests = await prisma.booking.findMany({
      where: {
        partnerId: session.user.id,
        bookingStatus: { in: ["REQUESTED"] },
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json({ requests }, { status: 200 });
  } catch (error) {
    console.error("FETCH_REQUESTS_ERR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
