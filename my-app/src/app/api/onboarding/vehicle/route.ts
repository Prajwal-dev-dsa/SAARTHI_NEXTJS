import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// High-security server validation regex for Indian Vehicle Registration plates
const INDIAN_VEHICLE_REGEX = /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$/;

export async function GET(_: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    // Pull the single most recent record submitted by this provider account
    const existingVehicle = await prisma.vehicle.findFirst({
      where: { ownerId: session.user.id },
      orderBy: { created_at: "desc" },
    });

    if (!existingVehicle) {
      return NextResponse.json({ vehicle: null }, { status: 200 });
    }

    return NextResponse.json({ vehicle: existingVehicle }, { status: 200 });
  } catch (error) {
    console.error("VEHICLE_GET_ERR:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized session credentials" },
        { status: 401 },
      );
    }

    const body = await req.json();
    const { type, vehicleNumber, model } = body;

    // Payload verification check
    if (!type || !vehicleNumber || !model) {
      return NextResponse.json(
        { error: "Missing required form fields" },
        { status: 400 },
      );
    }

    // Normalize user string to completely strip spaces and ensure structural uppercase consistency
    const sanitizedVehicleNumber = vehicleNumber
      .replace(/\s+/g, "")
      .toUpperCase();

    // Verification Check 1: Structural String Format Check via Explicit Regex Engine
    if (!INDIAN_VEHICLE_REGEX.test(sanitizedVehicleNumber)) {
      return NextResponse.json(
        {
          error:
            "Invalid registration plate format. Example valid format: MH12AB1234",
        },
        { status: 400 },
      );
    }

    // Verification Check 2: Global Database Collision Avoidance Check
    const registrationPlateCollisionCheck = await prisma.vehicle.findUnique({
      where: { vehicleNumber: sanitizedVehicleNumber },
    });

    // Check if that plate exists globally, and ensure it doesn't belong to the current user updating their own profile
    if (
      registrationPlateCollisionCheck &&
      registrationPlateCollisionCheck.ownerId !== session.user.id
    ) {
      return NextResponse.json(
        {
          error:
            "This plate registration is already associated with an existing vehicle on our system",
        },
        { status: 409 },
      );
    }

    // Scan for any historical data objects created by this specific individual profile
    const existingUserVehicle = await prisma.vehicle.findFirst({
      where: { ownerId: session.user.id },
    });

    // DB Transaction execution wrapper block
    const operationalResult = await prisma.$transaction(async (tx: any) => {
      let vehicleRecord;

      if (existingUserVehicle) {
        // Option A: Clean update path overriding old criteria
        vehicleRecord = await tx.vehicle.update({
          where: { id: existingUserVehicle.id },
          data: {
            type: type,
            model: model,
            vehicleNumber: sanitizedVehicleNumber,
            status: "PENDING",
          },
        });
      } else {
        // Option B: First-time entry instantiation sequence path
        vehicleRecord = await tx.vehicle.create({
          data: {
            ownerId: session.user.id,
            type: type,
            model: model,
            vehicleNumber: sanitizedVehicleNumber,
            status: "PENDING",
          },
        });
      }

      await tx.user.update({
        where: { id: session.user.id },
        data: { partnerOnboardingSteps: 1 },
      });

      return vehicleRecord;
    });

    return NextResponse.json(
      {
        message: "Vehicle configuration metrics recorded smoothly",
        data: operationalResult,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("VEHICLE_POST_ERR:", error);
    return NextResponse.json(
      { error: "Transactional storage error occurred" },
      { status: 500 },
    );
  }
}
