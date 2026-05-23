import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Reset their Video KYC status back to PENDING and clear the old reason
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        videoKycStatus: "PENDING",
        videoKycRejectReason: null,
      },
    });

    return NextResponse.json(
      { message: "Retry requested successfully." },
      { status: 200 },
    );
  } catch (error) {
    console.error("KYC_RETRY_ERR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
