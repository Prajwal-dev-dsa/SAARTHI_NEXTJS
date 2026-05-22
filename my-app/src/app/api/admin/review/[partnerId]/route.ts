import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// --- GET: Fetch Partner Details ---
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { partnerId } = await params;

    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        partnerStatus: true,
        created_at: true,
        vehicles: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
        documents: true,
        bankDetails: true,
      },
    });

    if (!partner) {
      return NextResponse.json({ error: "Partner not found" }, { status: 404 });
    }

    return NextResponse.json(partner, { status: 200 });
  } catch (error) {
    console.error("ADMIN_REVIEW_GET_ERR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// --- POST: Handle Approve or Reject Action ---
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ partnerId: string }> },
) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { partnerId } = await params;

    const body = await req.json();
    const { action, reason } = body;

    if (action === "APPROVE") {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: partnerId },
          data: {
            role: "PARTNER",
            partnerStatus: "APPROVED",
            partnerOnboardingSteps: 4,
          },
        }),
        prisma.vehicle.updateMany({
          where: { ownerId: partnerId },
          data: { status: "APPROVED" },
        }),
        prisma.partnerDocument.update({
          where: { ownerId: partnerId },
          data: { status: "APPROVED" },
        }),
        prisma.partnerBankDetail.update({
          where: { ownerId: partnerId },
          data: { status: "VERIFIED" },
        }),
      ]);

      return NextResponse.json(
        { message: "Partner successfully approved." },
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
            rejectReason: reason,
          },
        }),
        prisma.vehicle.updateMany({
          where: { ownerId: partnerId },
          data: { status: "REJECTED", rejectReason: reason },
        }),
        prisma.partnerDocument.update({
          where: { ownerId: partnerId },
          data: { status: "REJECTED", rejectReason: reason },
        }),
      ]);

      return NextResponse.json(
        { message: "Partner application rejected." },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Invalid action." }, { status: 400 });
  } catch (error) {
    console.error("ADMIN_REVIEW_POST_ERR:", error);
    return NextResponse.json(
      { error: "Failed to process action" },
      { status: 500 },
    );
  }
}
