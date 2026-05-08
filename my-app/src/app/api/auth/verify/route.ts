import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const { email, otp } = await req.json();

    if (!email || !otp) {
      return NextResponse.json(
        { error: "Email and OTP are required." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.isVerified) {
      return NextResponse.json(
        { error: "Email is already verified. Please log in." },
        { status: 400 },
      );
    }

    if (user.verifyOtp !== otp) {
      return NextResponse.json(
        { error: "Invalid verification code. Please try again." },
        { status: 400 },
      );
    }

    // Check if OTP has expired (10 minutes)
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json(
        { error: "Verification code has expired. Please register again." },
        { status: 400 },
      );
    }

    // If everything passes, mark the user as verified and clear the OTP fields
    await prisma.user.update({
      where: { email },
      data: {
        isVerified: true,
        verifyOtp: null,
        otpExpiry: null,
      },
    });

    return NextResponse.json(
      { message: "Email verified successfully!" },
      { status: 200 },
    );
  } catch (error: any) {
    console.error("Verification Error:", error);
    return NextResponse.json(
      { error: "An unexpected error occurred during verification." },
      { status: 500 },
    );
  }
}
