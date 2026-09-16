import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "COMPLETED", "CANCELLED"]),
  adminNote: z.string().max(1000).optional().nullable(),
});

/** Statuses a booking may still move to, keyed by where it is now. */
const allowedTransitions: Record<string, string[]> = {
  PENDING: ["APPROVED", "REJECTED", "CANCELLED"],
  APPROVED: ["COMPLETED", "CANCELLED"],
  REJECTED: [],
  COMPLETED: [],
  CANCELLED: [],
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = statusSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { status, adminNote } = parsed.data;

  const booking = await prisma.booking.findUnique({
    where: { id },
    select: {
      id: true,
      userId: true,
      carId: true,
      branchId: true,
      status: true,
      pointsEarned: true,
      pointsUsed: true,
      bookingNumber: true,
    },
  });

  if (!booking) {
    return NextResponse.json({ error: "Booking not found" }, { status: 404 });
  }

  const role = session.user.role;
  const isStaff = role === "ADMIN" || role === "SUPER_ADMIN";
  const isOwner = booking.userId === session.user.id;

  // Customers may only walk away from their own booking; everything else is staff-only.
  if (!isStaff && !(isOwner && status === "CANCELLED")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (role === "ADMIN" && session.user.branchId && session.user.branchId !== booking.branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  if (!allowedTransitions[booking.status]?.includes(status)) {
    return NextResponse.json(
      { error: `Cannot move a ${booking.status} booking to ${status}` },
      { status: 409 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.booking.update({
      where: { id },
      data: { status, ...(adminNote !== undefined ? { adminNote } : {}) },
    });

    // An approved booking takes the car off the fleet until it comes back.
    if (status === "APPROVED") {
      await tx.car.update({ where: { id: booking.carId }, data: { status: "BOOKED" } });
    }

    if (status === "COMPLETED" || status === "CANCELLED" || status === "REJECTED") {
      await tx.car.update({ where: { id: booking.carId }, data: { status: "AVAILABLE" } });
    }

    // Points are earned on completion only.
    if (status === "COMPLETED" && booking.pointsEarned > 0) {
      await tx.user.update({
        where: { id: booking.userId },
        data: { points: { increment: booking.pointsEarned } },
      });
      await tx.pointHistory.create({
        data: {
          userId: booking.userId,
          points: booking.pointsEarned,
          description: `Earned from booking ${booking.bookingNumber}`,
          bookingId: booking.id,
        },
      });
    }

    // A booking that never happened gives back the points it consumed.
    if ((status === "REJECTED" || status === "CANCELLED") && booking.pointsUsed > 0) {
      await tx.user.update({
        where: { id: booking.userId },
        data: { points: { increment: booking.pointsUsed } },
      });
      await tx.pointHistory.create({
        data: {
          userId: booking.userId,
          points: booking.pointsUsed,
          description: `Refunded from booking ${booking.bookingNumber}`,
          bookingId: booking.id,
        },
      });
    }

    return result;
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    adminNote: updated.adminNote,
  });
}
