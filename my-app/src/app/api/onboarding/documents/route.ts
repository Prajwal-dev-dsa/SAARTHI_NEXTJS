import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";
import { uploadOnCloudinary } from "@/lib/cloudinary";

export async function GET(_: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const documents = await prisma.partnerDocument.findUnique({
      where: { ownerId: session.user.id },
    });

    return NextResponse.json({ documents }, { status: 200 });
  } catch (error) {
    console.error("DOCS_GET_ERR:", error);
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
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Parse the multipart/form-data
    const formData = await req.formData();

    // Extract files (can be null if not provided in this request)
    const aadhaarFile = formData.get("aadhaar") as File | null;
    const licenseFile = formData.get("license") as File | null;
    const rcFile = formData.get("rc") as File | null;

    // Fetch existing documents to ensure we don't overwrite existing URLs with blanks
    const existingDocs = await prisma.partnerDocument.findUnique({
      where: { ownerId: session.user.id },
    });

    let aadhaarUrl = existingDocs?.aadharCardUrl || "";
    let licenseUrl = existingDocs?.drivingLicenseUrl || "";
    let rcUrl = existingDocs?.rcUrl || "";

    // Upload to Cloudinary ONLY if a new file was attached
    if (aadhaarFile && aadhaarFile.size > 0) {
      const url = await uploadOnCloudinary(aadhaarFile);
      if (url) aadhaarUrl = url;
    }
    if (licenseFile && licenseFile.size > 0) {
      const url = await uploadOnCloudinary(licenseFile);
      if (url) licenseUrl = url;
    }
    if (rcFile && rcFile.size > 0) {
      const url = await uploadOnCloudinary(rcFile);
      if (url) rcUrl = url;
    }

    // Strict Check: Ensure all 3 URLs exist before saving
    if (!aadhaarUrl || !licenseUrl || !rcUrl) {
      return NextResponse.json(
        { error: "All 3 documents are required." },
        { status: 400 },
      );
    }

    // Database Transaction: Upsert Documents AND Update User Step
    const result = await prisma.$transaction(async (tx: any) => {
      // Upsert will CREATE if it doesn't exist, or UPDATE if it does (based on ownerId)
      const docs = await tx.partnerDocument.upsert({
        where: { ownerId: session.user.id },
        update: {
          aadharCardUrl: aadhaarUrl,
          drivingLicenseUrl: licenseUrl,
          rcUrl: rcUrl,
          status: "PENDING",
        },
        create: {
          ownerId: session.user.id,
          aadharCardUrl: aadhaarUrl,
          drivingLicenseUrl: licenseUrl,
          rcUrl: rcUrl,
          status: "PENDING",
        },
      });

      // Update Onboarding Step Tracker to 2
      await tx.user.update({
        where: { id: session.user.id },
        data: { partnerOnboardingSteps: 2 },
      });

      return docs;
    });

    return NextResponse.json(
      { message: "Documents uploaded successfully", documents: result },
      { status: 200 },
    );
  } catch (error) {
    console.error("DOCS_POST_ERR:", error);
    return NextResponse.json(
      { error: "Failed to process documents" },
      { status: 500 },
    );
  }
}
