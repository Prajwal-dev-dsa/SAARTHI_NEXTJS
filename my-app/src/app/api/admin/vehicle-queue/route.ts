import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const queue = await prisma.user.findMany({
      where: {
        partnerOnboardingSteps: 6,
        partnerStatus: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        created_at: true,
        vehicles: {
          take: 1,
          select: { type: true, model: true, vehicleNumber: true },
        },
      },
      orderBy: { updated_at: "desc" },
    });

    return NextResponse.json(queue, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
