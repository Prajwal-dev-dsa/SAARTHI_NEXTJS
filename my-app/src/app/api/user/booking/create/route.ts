import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

// Utility to generate a random 4-digit OTP
const generateOTP = () => Math.floor(1000 + Math.random() * 9000).toString();

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const userId = session.user.id;

    // If the user already has a ride that isn't finished, return it immediately!
    const existingActiveBooking = await prisma.booking.findFirst({
      where: {
        userId: userId,
        bookingStatus: {
          in: ["REQUESTED", "AWAITING_PAYMENT", "CONFIRMED", "STARTED"],
        },
      },
    });

    if (existingActiveBooking) {
      return NextResponse.json(
        {
          message: "Active ride already exists. Redirecting...",
          booking: existingActiveBooking,
          isExisting: true,
        },
        { status: 200 },
      );
    }

    const body = await req.json();
    const {
      partnerId,
      pickUpAddress,
      dropAddress,
      pickUpLocation,
      dropLocation,
      fare,
      userMobileNumber,
    } = body;

    if (!partnerId || !pickUpLocation || !dropLocation || !fare) {
      return NextResponse.json(
        { error: "Missing required booking details." },
        { status: 400 },
      );
    }

    const partner = await prisma.user.findUnique({
      where: { id: partnerId },
      include: {
        vehicles: true,
      },
    });

    if (!partner || !partner.vehicles.length) {
      return NextResponse.json(
        { error: "Partner or Vehicle not found in system." },
        { status: 404 },
      );
    }

    const partnerVehicle = partner.vehicles[0];

    // Example: Platform takes 20% commission, Partner keeps 80%
    const numericFare = parseFloat(fare);
    const adminComission = parseFloat((numericFare * 0.2).toFixed(2));
    const partnerAmount = parseFloat((numericFare * 0.8).toFixed(2));

    // Generate PickUp OTP
    const pickUpOtp = generateOTP();
    // Expiration set to 1 hour from now
    const pickupOtpExpire = new Date(Date.now() + 60 * 60 * 1000);

    const newBooking = await prisma.booking.create({
      data: {
        userId: userId,
        partnerId: partner.id,
        vehicleId: partnerVehicle.id,
        pickUpAddress,
        dropAddress,
        pickUpLocation: {
          type: "Point",
          coordinates: [pickUpLocation.lng, pickUpLocation.lat],
        },
        dropLocation: {
          type: "Point",
          coordinates: [dropLocation.lng, dropLocation.lat],
        },
        fare: numericFare,
        adminComission,
        partnerAmount,
        userMobileNumber: userMobileNumber || "Not Provided",
        partnerMobileNumber: partner.phone || "Not Provided",
        bookingStatus: "REQUESTED",
        paymentStatus: "PENDING",
        pickUpOtp,
        pickupOtpExpire,
      },
    });

    return NextResponse.json(
      {
        message: "Booking created successfully",
        booking: newBooking,
        isExisting: false,
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("BOOKING_CREATE_ERR:", error);
    return NextResponse.json(
      { error: "Failed to initialize booking." },
      { status: 500 },
    );
  }
}
