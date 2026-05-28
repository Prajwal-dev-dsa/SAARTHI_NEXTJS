import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { uploadOnCloudinary } from "@/lib/cloudinary";

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

    // 1. Parse FormData instead of JSON
    const formData = await req.formData();

    const baseFare = Number(formData.get("baseFare"));
    const pricePerKm = Number(formData.get("pricePerKm"));
    const waitingCharge = Number(formData.get("waitingCharge"));

    // 2. Extract Files
    const frontFile = formData.get("frontImage") as File | null;
    const backFile = formData.get("backImage") as File | null;
    const leftFile = formData.get("leftImage") as File | null;
    const rightFile = formData.get("rightImage") as File | null;

    if (baseFare < 0 || pricePerKm < 0 || waitingCharge < 0) {
      return NextResponse.json(
        { error: "Pricing cannot be negative." },
        { status: 400 },
      );
    }

    // 3. Fetch existing vehicle to prevent overwriting old URLs with blanks
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { ownerId: session.user.id },
    });

    if (!existingVehicle)
      return NextResponse.json(
        { error: "Vehicle not found." },
        { status: 404 },
      );

    let frontUrl = existingVehicle.frontImageUrl || "";
    let backUrl = existingVehicle.backImageUrl || "";
    let leftUrl = existingVehicle.leftImageUrl || "";
    let rightUrl = existingVehicle.rightImageUrl || "";

    // 4. Upload new files to Cloudinary ONLY if they were attached
    if (frontFile && frontFile.size > 0)
      frontUrl = (await uploadOnCloudinary(frontFile)) || frontUrl;
    if (backFile && backFile.size > 0)
      backUrl = (await uploadOnCloudinary(backFile)) || backUrl;
    if (leftFile && leftFile.size > 0)
      leftUrl = (await uploadOnCloudinary(leftFile)) || leftUrl;
    if (rightFile && rightFile.size > 0)
      rightUrl = (await uploadOnCloudinary(rightFile)) || rightUrl;

    if (!frontUrl || !backUrl || !leftUrl || !rightUrl) {
      return NextResponse.json(
        { error: "All 4 vehicle images are required." },
        { status: 400 },
      );
    }

    // 5. Update Database
    await prisma.vehicle.update({
      where: { id: existingVehicle.id },
      data: {
        frontImageUrl: frontUrl,
        backImageUrl: backUrl,
        leftImageUrl: leftUrl,
        rightImageUrl: rightUrl,
        baseFare,
        pricePerKm,
        waitingCharge,
        status: "PENDING",
      },
    });

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
    console.error("PRICING_POST_ERR:", error);
    return NextResponse.json(
      { error: "Failed to save details." },
      { status: 500 },
    );
  }
}
