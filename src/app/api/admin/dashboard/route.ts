import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UNASSIGNED_BRANCH } from "@/lib/admin-guard";
import { serializeDecimals } from "@/lib/utils";
import type { Prisma } from "@prisma/client";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;

  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // A branch admin only ever sees their own branch.
  const branchId =
    role === "ADMIN" ? session.user.branchId ?? UNASSIGNED_BRANCH : undefined;
  const carScope: Prisma.CarWhereInput = branchId ? { branchId } : {};
  const bookingScope: Prisma.BookingWhereInput = branchId ? { branchId } : {};

  const [
    totalCars,
    availableCars,
    bookedCars,
    totalCustomers,
    totalBookings,
    pendingBookings,
    pendingDocuments,
    revenue,
    recentBookings,
  ] = await Promise.all([
    prisma.car.count({ where: carScope }),
    prisma.car.count({ where: { ...carScope, status: "AVAILABLE" } }),
    prisma.car.count({ where: { ...carScope, status: "BOOKED" } }),
    prisma.user.count({ where: { role: "USER" } }),
    prisma.booking.count({ where: bookingScope }),
    prisma.booking.count({ where: { ...bookingScope, status: "PENDING" } }),
    prisma.document.count({
      where: { status: "PENDING", ...(branchId ? { booking: { branchId } } : {}) },
    }),
    prisma.booking.aggregate({
      where: { ...bookingScope, status: { in: ["APPROVED", "COMPLETED"] } },
      _sum: { totalAmount: true },
    }),
    prisma.booking.findMany({
      where: bookingScope,
      include: {
        car: { select: { name: true, nameAr: true, images: true } },
        user: { select: { name: true, email: true } },
        branch: { select: { name: true, nameAr: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
  ]);

  return NextResponse.json({
    scope: branchId ? "branch" : "all",
    cars: { total: totalCars, available: availableCars, booked: bookedCars },
    bookings: { total: totalBookings, pending: pendingBookings },
    documents: { pending: pendingDocuments },
    customers: totalCustomers,
    revenue: Number(revenue._sum.totalAmount ?? 0),
    recentBookings: serializeDecimals(recentBookings),
  });
}
