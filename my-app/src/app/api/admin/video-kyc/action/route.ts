import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json();
    const { roomId, action, reason } = body;

    if (!roomId || !action) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Find the partner who owns this room
    const partner = await prisma.user.findUnique({
      where: { videoKycRoomId: roomId },
    });

    if (!partner) {
      return NextResponse.json(
        { error: "Room not found or expired" },
        { status: 404 },
      );
    }

    if (action === "APPROVE") {
      await prisma.user.update({
        where: { id: partner.id },
        data: {
          videoKycStatus: "APPROVED",
          partnerOnboardingSteps: 5, // Bump them to Step 5 (Pricing)
          videoKycRoomId: null, // Clear the room ID so it can't be reused
        },
      });
      return NextResponse.json(
        { message: "Video KYC Approved" },
        { status: 200 },
      );
    }

    if (action === "REJECT") {
      if (!reason)
        return NextResponse.json({ error: "Reason required" }, { status: 400 });

      await prisma.user.update({
        where: { id: partner.id },
        data: {
          videoKycStatus: "REJECTED",
          videoKycRejectReason: reason,
          videoKycRoomId: null, // Clear the room
        },
      });
      return NextResponse.json(
        { message: "Video KYC Rejected" },
        { status: 200 },
      );
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("KYC_ACTION_ERR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
