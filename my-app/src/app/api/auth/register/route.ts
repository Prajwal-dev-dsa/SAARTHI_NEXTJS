import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    // 1. Parse the incoming request body
    const body = await req.json();
    const { name, email, password } = body;

    // 2. Validate mandatory fields
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required fields." },
        { status: 400 },
      );
    }

    // 3. Strict validation: Email format using Regex
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Please provide a valid email address." },
        { status: 400 },
      );
    }

    // 4. Strict validation: Password length check
    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters long." },
        { status: 400 },
      );
    }

    // 5. Database Check: Ensure email is unique
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "A user with this email already exists." },
        { status: 409 }, // 409 Conflict is the standard status code for duplicates
      );
    }

    // 6. Security: Hash the password
    // The "10" is the salt rounds. 10 is the industry standard balance of speed and security.
    const hashedPassword = await bcrypt.hash(password, 10);

    // 7. Save to Database: Create the new user
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        // role and created_at will be automatically set by Prisma based on our schema defaults!
      },
    });

    // 8. Safe Response: Return success without leaking the hashed password
    return NextResponse.json(
      {
        message: "User registered successfully!",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          role: newUser.role,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Registration Error:", error);
    // Fallback error handler for unexpected issues (like a broken database connection)
    return NextResponse.json(
      { error: "Something went wrong during registration. Please try again." },
      { status: 500 },
    );
  }
}
