import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // 1. Strict Authentication & Role Guard
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json(
        { error: "Forbidden: Admin access required." },
        { status: 403 },
      );
    }

    // 2. Execute Aggregation Queries Concurrently
    const [totalPartners, approvedPartners, pendingPartners, rejectedPartners] =
      await Promise.all([
        // Total applicants (anyone who has started the onboarding process)
        prisma.user.count({ where: { partnerOnboardingSteps: { gt: 0 } } }),
        // Approved applicants
        prisma.user.count({ where: { partnerStatus: "APPROVED" } }),
        // Pending applicants (currently going through the steps or waiting for review)
        prisma.user.count({
          where: {
            partnerStatus: "PENDING",
            partnerOnboardingSteps: { gt: 0 },
          },
        }),
        // Rejected applicants
        prisma.user.count({ where: { partnerStatus: "REJECTED" } }),
      ]);

    // 3. Fetch "Under Review" Partners with Deep Relational Data
    const underReviewPartners = await prisma.user.findMany({
      where: {
        partnerOnboardingSteps: { gte: 3 }, // Reached the bank step
        partnerStatus: "PENDING",
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        partnerOnboardingSteps: true,
        created_at: true,
        vehicles: {
          orderBy: { created_at: "desc" },
          take: 1,
        },
        documents: true,
        bankDetails: true,
      },
      orderBy: { created_at: "asc" },
    });

    // 4. Return the Unified Data Payload
    return NextResponse.json(
      {
        metrics: {
          total: totalPartners,
          approved: approvedPartners,
          pending: pendingPartners,
          rejected: rejectedPartners,
        },
        underReview: underReviewPartners,
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("ADMIN_DASHBOARD_GET_ERR:", error);
    return NextResponse.json(
      { error: "Failed to fetch admin dashboard metrics" },
      { status: 500 },
    );
  }
}
