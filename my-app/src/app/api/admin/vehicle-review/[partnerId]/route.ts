import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { partnerId } = await params;
    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        partnerStatus: true,
        vehicles: { take: 1 },
      },
    });

    if (!partner || !partner.vehicles.length)
      return NextResponse.json(
        { error: "Vehicle details not found" },
        { status: 404 },
      );
    return NextResponse.json(
      {
        user: {
          name: partner.name,
          email: partner.email,
          status: partner.partnerStatus,
        },
        vehicle: partner.vehicles[0],
      },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { partnerId } = await params;
    const body = await req.json();
    const { action, reason } = body;

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: partnerId },
          data: {
            partnerStatus: "APPROVED",
            partnerOnboardingSteps: 8,
            rejectReason: null,
          },
        }),
        prisma.vehicle.updateMany({
          where: { ownerId: partnerId },
          data: { status: "APPROVED", isActive: true, rejectReason: null },
        }),
      ]);
      return NextResponse.json(
        { message: "Partner is now LIVE!" },
        { status: 200 },
      );
    }

    if (action === "REJECT") {
      if (!reason) {
        return NextResponse.json(
          { error: "Rejection reason is required." },
          { status: 400 },
        );
      }

      await prisma.$transaction([
        prisma.user.update({
          where: { id: partnerId },
          data: {
            partnerStatus: "REJECTED",
            partnerOnboardingSteps: 6,
            rejectReason: reason,
          },
        }),
        prisma.vehicle.updateMany({
          where: { ownerId: partnerId },
          data: { status: "REJECTED", rejectReason: reason },
        }),
      ]);

      return NextResponse.json(
        { message: "Vehicle review rejected." },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 },
    );
  }
}
