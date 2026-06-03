import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const bookings = await prisma.booking.findMany({
      where: {
        bookingStatus: "COMPLETED",
        updated_at: { gte: sevenDaysAgo },
      },
      select: { updated_at: true, adminComission: true },
    });

    // Initialize 7 days array
    const daysMap = new Map();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      daysMap.set(dateStr, { date: dateStr, amount: 0 });
    }

    // Aggregate
    bookings.forEach((b) => {
      const dateStr = b.updated_at.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      if (daysMap.has(dateStr)) {
        daysMap.get(dateStr).amount += b.adminComission;
      }
    });

    const chartData = Array.from(daysMap.values());
    const total = chartData.reduce((sum, item) => sum + item.amount, 0);
    const avg = total / 7;
    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    const todayAmount = daysMap.get(todayStr)?.amount || 0;

    let bestDay = chartData[0];
    chartData.forEach((day) => {
      if (day.amount > bestDay.amount) bestDay = day;
    });

    return NextResponse.json({
      chartData,
      weeklyTotal: total,
      dailyAvg: avg,
      todayAmount: todayAmount,
      bestDay: bestDay.amount > 0 ? bestDay : { date: "-", amount: 0 },
    });
  } catch (error) {
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
