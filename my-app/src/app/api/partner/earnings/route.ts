import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import prisma from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "PARTNER") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const bookings = await prisma.booking.findMany({
      where: {
        partnerId: session.user.id,
        OR: [
          { bookingStatus: "COMPLETED" },
          {
            bookingStatus: "CANCELLED",
            paymentStatus: "PAID",
          },
        ],
        updated_at: { gte: sevenDaysAgo },
      },
      select: { updated_at: true, partnerAmount: true },
    });

    const daysMap = new Map<string, { date: string; amount: number }>();

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      daysMap.set(dateStr, { date: dateStr, amount: 0 });
    }

    bookings.forEach((b: { updated_at: Date; partnerAmount: number }) => {
      const dateStr = b.updated_at.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
      });
      if (daysMap.has(dateStr)) {
        const existing = daysMap.get(dateStr)!;
        existing.amount += b.partnerAmount;
      }
    });

    const chartData = Array.from(daysMap.values());
    const total = chartData.reduce(
      (sum, item: { amount: number }) => sum + item.amount,
      0,
    );
    const avg = total / 7;
    const todayStr = new Date().toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
    });
    const todayAmount = daysMap.get(todayStr)?.amount || 0;

    let bestDay = chartData[0];
    chartData.forEach((day: { date: string; amount: number }) => {
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
