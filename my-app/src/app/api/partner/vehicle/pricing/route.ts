import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vehicle = await prisma.vehicle.findFirst({
      where: { ownerId: session.user.id },
      select: {
        frontImageUrl: true,
        backImageUrl: true,
        leftImageUrl: true,
        rightImageUrl: true,
        baseFare: true,
        pricePerKm: true,
        waitingCharge: true,
      },
    });

    if (!vehicle)
      return NextResponse.json({ error: "No vehicle found." }, { status: 404 });
    return NextResponse.json(vehicle, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const {
      frontImageUrl,
      backImageUrl,
      leftImageUrl,
      rightImageUrl,
      baseFare,
      pricePerKm,
      waitingCharge,
    } = body;

    if (!frontImageUrl || !backImageUrl || !leftImageUrl || !rightImageUrl) {
      return NextResponse.json(
        { error: "All 4 vehicle images are required." },
        { status: 400 },
      );
    }
    if (baseFare < 0 || pricePerKm < 0 || waitingCharge < 0) {
      return NextResponse.json(
        { error: "Pricing cannot be negative." },
        { status: 400 },
      );
    }

    await prisma.vehicle.updateMany({
      where: { ownerId: session.user.id },
      data: {
        frontImageUrl,
        backImageUrl,
        leftImageUrl,
        rightImageUrl,
        baseFare: Number(baseFare),
        pricePerKm: Number(pricePerKm),
        waitingCharge: Number(waitingCharge),
        status: "PENDING",
      },
    });

    // FIX: Bump to Step 6 and strictly reset status to PENDING for the Queue
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        partnerOnboardingSteps: 6,
        partnerStatus: "PENDING",
        rejectReason: null,
      },
    });

    return NextResponse.json(
      { message: "Pricing and images saved successfully." },
      { status: 200 },
    );
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to save details." },
      { status: 500 },
    );
  }
}
