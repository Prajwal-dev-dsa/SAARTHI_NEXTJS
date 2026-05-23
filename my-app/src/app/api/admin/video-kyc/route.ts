import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// GET: Fetch the Video KYC Queue
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const queue = await prisma.user.findMany({
      where: {
        videoKycStatus: {
          in: ["PENDING", "IN_PROGRESS"],
        },
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        videoKycStatus: true,
        videoKycRoomId: true,
        created_at: true,
      },
      orderBy: { updated_at: "desc" },
    });

    return NextResponse.json(queue, { status: 200 });
  } catch (error) {
    console.error("KYC_QUEUE_ERR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

// POST: Start the Video KYC Call
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN")
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { partnerId } = body;

    if (!partnerId)
      return NextResponse.json(
        { error: "Partner ID is required" },
        { status: 400 },
      );

    // Generate an industry-standard secure room ID (e.g., saarthi-kyc-8a2b4c6d)
    const secureId = crypto.randomBytes(4).toString("hex");
    const roomId = `saarthi-kyc-${secureId}`;

    // Update the partner's status to IN_PROGRESS and inject the Room ID
    const updatedPartner = await prisma.user.update({
      where: { id: partnerId },
      data: {
        videoKycStatus: "IN_PROGRESS",
        videoKycRoomId: roomId,
        updated_at: new Date(),
      },
    });

    return NextResponse.json(
      {
        message: "Call initiated successfully",
        roomId: updatedPartner.videoKycRoomId,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("START_KYC_ERR:", error);
    return NextResponse.json(
      { error: "Failed to initiate call" },
      { status: 500 },
    );
  }
}
