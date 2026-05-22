import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

// Indian Bank Accounts: 9 to 18 digits, numbers only.
const ACCOUNT_NUMBER_REGEX = /^\d{9,18}$/;

// IFSC Code: 4 letters, followed by a '0', followed by 6 alphanumeric characters.
const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

// Indian Mobile Number: 10 digits starting with 6, 7, 8, or 9.
const MOBILE_REGEX = /^[6-9]\d{9}$/;

export async function GET(_: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized access" },
        { status: 401 },
      );
    }

    const bankDetails = await prisma.partnerBankDetail.findUnique({
      where: { ownerId: session.user.id },
    });

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { phone: true },
    });

    return NextResponse.json(
      { bankDetails, phone: user?.phone || "" },
      { status: 200 },
    );
  } catch (error) {
    console.error("BANK_GET_ERR:", error);
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
    const { accountHolderName, accountNumber, ifscCode, mobileNumber, upiId } =
      body;

    // 1. Basic Presence Validation
    if (!accountHolderName || !accountNumber || !ifscCode || !mobileNumber) {
      return NextResponse.json(
        { error: "Please fill in all required fields." },
        { status: 400 },
      );
    }

    // 2. Format & Sanitize Inputs
    const sanitizedAccountNumber = accountNumber.replace(/\s+/g, "");
    const sanitizedIfsc = ifscCode.replace(/\s+/g, "").toUpperCase();
    const sanitizedMobile = mobileNumber.replace(/\s+/g, "");

    // 3. Strict Regex Validation Blocks
    if (!ACCOUNT_NUMBER_REGEX.test(sanitizedAccountNumber)) {
      return NextResponse.json(
        {
          error:
            "Invalid account number. It must be between 9 and 18 digits with no special characters.",
        },
        { status: 400 },
      );
    }

    if (!IFSC_REGEX.test(sanitizedIfsc)) {
      return NextResponse.json(
        {
          error:
            "Invalid IFSC code. Ensure it is 11 characters (e.g., HDFC0001234).",
        },
        { status: 400 },
      );
    }

    if (!MOBILE_REGEX.test(sanitizedMobile)) {
      return NextResponse.json(
        {
          error:
            "Invalid mobile number. Please enter a valid 10-digit Indian mobile number.",
        },
        { status: 400 },
      );
    }

    // 4. Uniqueness Check: Prevent duplicate bank accounts across the platform
    const existingBankAccount = await prisma.partnerBankDetail.findUnique({
      where: { accountNumber: sanitizedAccountNumber },
    });

    if (
      existingBankAccount &&
      existingBankAccount.ownerId !== session.user.id
    ) {
      return NextResponse.json(
        {
          error:
            "This bank account number is already registered with another partner.",
        },
        { status: 409 },
      );
    }

    // 5. Database Transaction: Upsert Bank Details AND Update User
    const result = await prisma.$transaction(async (tx) => {
      // Upsert the bank details
      const bankRecord = await tx.partnerBankDetail.upsert({
        where: { ownerId: session.user.id },
        update: {
          accountHolderName,
          accountNumber: sanitizedAccountNumber,
          ifscCode: sanitizedIfsc,
          upiId: upiId || null,
          status: "ADDED",
        },
        create: {
          ownerId: session.user.id,
          accountHolderName,
          accountNumber: sanitizedAccountNumber,
          ifscCode: sanitizedIfsc,
          upiId: upiId || null,
          status: "ADDED",
        },
      });

      // Update the User's phone number AND bump the onboarding step to 3
      await tx.user.update({
        where: { id: session.user.id },
        data: {
          phone: sanitizedMobile,
          partnerOnboardingSteps: 3,
          partnerStatus: "PENDING",
        },
      });

      return bankRecord;
    });

    return NextResponse.json(
      { message: "Bank details secured successfully", data: result },
      { status: 200 },
    );
  } catch (error) {
    console.error("BANK_POST_ERR:", error);
    return NextResponse.json(
      { error: "Failed to process bank details" },
      { status: 500 },
    );
  }
}
