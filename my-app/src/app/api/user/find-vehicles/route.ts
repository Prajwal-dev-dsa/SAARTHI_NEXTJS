import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

function getDistanceFromLatLonInKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
) {
  const R = 6371;
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export async function POST(req: Request) {
  try {
    const { pickupLat, pickupLng, vehicleType } = await req.json();

    if (!pickupLat || !pickupLng || !vehicleType) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // 1. Fetch EVERY online partner (Super forgiving for development)
    const onlinePartners = await prisma.user.findMany({
      where: {
        role: "PARTNER",
        isOnline: true,
      },
      include: { vehicles: true }, // Grab all their vehicles
    });

    console.log(`Found ${onlinePartners.length} online partners in DB.`);

    const availableVehicles: any[] = [];
    const MAX_DISTANCE_KM = 10;

    // 2. Manually filter them so we can log EXACTLY why someone fails
    onlinePartners.forEach((partner) => {
      // Check Location
      const loc = partner.location as { coordinates?: [number, number] } | null;
      if (!loc || !loc.coordinates) {
        console.log(`Partner ${partner.name} skipped: No GPS location found.`);
        return;
      }

      // Check Vehicles
      const matchingVehicle = partner.vehicles.find(
        (v) => v.type === vehicleType.toUpperCase(),
      );
      if (!matchingVehicle) {
        console.log(
          `Partner ${partner.name} skipped: They do not own a ${vehicleType}.`,
        );
        return;
      }

      // Check Distance
      const [partnerLng, partnerLat] = loc.coordinates;
      const distance = getDistanceFromLatLonInKm(
        pickupLat,
        pickupLng,
        partnerLat,
        partnerLng,
      );

      if (distance > MAX_DISTANCE_KM) {
        console.log(
          `Partner ${partner.name} skipped: Too far away (${distance.toFixed(1)} km).`,
        );
        return;
      }

      console.log(
        `Partner ${partner.name} matched! Distance: ${distance.toFixed(2)} km`,
      );

      // Success! Add them to the array
      availableVehicles.push({
        partnerId: partner.id,
        socketId: partner.socketId,
        partnerName: partner.name,
        vehicleId: matchingVehicle.id,
        vehicleModel: matchingVehicle.model,
        vehicleNumber: matchingVehicle.vehicleNumber,
        baseFare: matchingVehicle.baseFare,
        pricePerKm: matchingVehicle.pricePerKm,
        distanceFromPickup: distance,
        waitingCharge: matchingVehicle.waitingCharge,
        leftImageUrl: matchingVehicle.leftImageUrl,
        rightImageUrl: matchingVehicle.rightImageUrl,
      });
    });

    availableVehicles.sort(
      (a, b) => a.distanceFromPickup - b.distanceFromPickup,
    );

    return NextResponse.json(
      {
        message: "Search complete",
        count: availableVehicles.length,
        vehicles: availableVehicles,
      },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Error finding nearby vehicles:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
