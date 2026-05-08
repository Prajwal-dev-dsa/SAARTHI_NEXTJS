import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma"; // Adjust path if needed
import { sendVerificationEmail } from "@/lib/mail"; // Import our new mail utility

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required fields." },
        { status: 400 },
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    // 1. Generate 6-digit OTP and calculate expiry (10 minutes from now)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 2. Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      // If user exists and is already verified, block them
      if (existingUser.isVerified) {
        return NextResponse.json(
          {
            error:
              "A verified user with this email already exists. Please log in.",
          },
          { status: 409 },
        );
      }

      // ENTERPRISE LOGIC: If user exists but is NOT verified, update their OTP and password instead of failing
      await prisma.user.update({
        where: { email },
        data: {
          name,
          password: hashedPassword,
          verifyOtp: otp,
          otpExpiry: otpExpiry,
        },
      });

      // Send the email
      await sendVerificationEmail(email, otp);

      return NextResponse.json(
        { message: "OTP resent. Please verify your email.", email: email },
        { status: 200 },
      );
    }

    // 3. Create a brand new unverified user
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isVerified: false,
        verifyOtp: otp,
        otpExpiry: otpExpiry,
      },
    });

    // Send the email
    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return NextResponse.json(
        {
          error:
            "User created, but failed to send verification email. Please try again.",
        },
        { status: 500 },
      );
    }

    // 4. Return success (Frontend will catch this and switch to the OTP screen)
    return NextResponse.json(
      {
        message: "Registration successful. Please verify your email.",
        email: email,
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Registration Error:", error);

    if (
      error.code === "P1001" ||
      error?.message?.includes("DatabaseNotReachable")
    ) {
      return NextResponse.json(
        {
          error:
            "Cannot reach the database server. Please check your connection.",
        },
        { status: 503 },
      );
    }

    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}
