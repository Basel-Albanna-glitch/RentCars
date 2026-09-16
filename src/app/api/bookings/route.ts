import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { bookingToPoints } from "@/lib/utils";

const createBookingSchema = z.object({
  // Ids are opaque Prisma strings, not necessarily UUIDs (the seed uses
  // readable ids like "car-glc-001"). Existence is checked against the DB below.
  carId: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  totalDays: z.number().int().min(1),
  baseAmount: z.number().positive(),
  seasonMultiplier: z.number().min(1).default(1),
  discountAmount: z.number().min(0).default(0),
  depositAmount: z.number().min(0),
  totalAmount: z.number().positive(),
  pointsUsed: z.number().int().min(0).default(0),
  paymentMethod: z.enum(["VISA", "MASTERCARD", "CLIQ", "CASH"]),
  needsDelivery: z.boolean().default(false),
  deliveryAddress: z.string().optional().nullable(),
  documents: z.array(z.object({
    type: z.enum(["NATIONAL_ID", "DRIVING_LICENSE", "PASSPORT"]),
    // Cloudinary returns an absolute URL; the local-development fallback in
    // /api/upload returns a root-relative path under /uploads.
    imageUrl: z.string().url().or(z.string().startsWith("/uploads/")),
  })),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createBookingSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data", details: parsed.error.flatten() }, { status: 400 });
  }

  const data = parsed.data;

  // Check car availability
  const car = await prisma.car.findUnique({
    where: { id: data.carId },
    include: { branch: true },
  });

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  if (car.status !== "AVAILABLE") {
    return NextResponse.json({ error: "Car is not available" }, { status: 400 });
  }

  // Check for conflicting bookings
  const conflict = await prisma.booking.findFirst({
    where: {
      carId: data.carId,
      status: { in: ["PENDING", "APPROVED"] },
      OR: [
        {
          startDate: { lte: new Date(data.endDate) },
          endDate: { gte: new Date(data.startDate) },
        },
      ],
    },
  });

  if (conflict) {
    return NextResponse.json({ error: "Car is already booked for these dates" }, { status: 409 });
  }

  // Check user has enough points if using points
  if (data.pointsUsed > 0) {
    const user = await prisma.user.findUnique({ where: { id: session.user.id } });
    if (!user || user.points < data.pointsUsed) {
      return NextResponse.json({ error: "Insufficient points" }, { status: 400 });
    }
  }

  // Create booking in transaction
  const booking = await prisma.$transaction(async (tx) => {
    const newBooking = await tx.booking.create({
      data: {
        userId: session.user.id,
        carId: data.carId,
        branchId: car.branchId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        totalDays: data.totalDays,
        baseAmount: data.baseAmount,
        seasonMultiplier: data.seasonMultiplier,
        discountAmount: data.discountAmount,
        depositAmount: data.depositAmount,
        totalAmount: data.totalAmount,
        pointsUsed: data.pointsUsed,
        pointsEarned: bookingToPoints(data.totalAmount),
        // The payment method lives on the Payment row created below.
        needsDelivery: data.needsDelivery,
        deliveryAddress: data.deliveryAddress,
        status: "PENDING",
        documents: {
          create: data.documents.map((doc) => ({
            userId: session.user.id,
            type: doc.type as any,
            imageUrl: doc.imageUrl,
            status: "PENDING",
          })),
        },
        payments: {
          create: {
            amount: data.totalAmount,
            method: data.paymentMethod as any,
            status: "PENDING",
          },
        },
      },
      include: { documents: true, payments: true },
    });

    // Deduct points if used
    if (data.pointsUsed > 0) {
      await tx.user.update({
        where: { id: session.user.id },
        data: { points: { decrement: data.pointsUsed } },
      });

      await tx.pointHistory.create({
        data: {
          userId: session.user.id,
          points: -data.pointsUsed,
          description: `Used for booking ${newBooking.bookingNumber}`,
          bookingId: newBooking.id,
        },
      });
    }

    return newBooking;
  });

  return NextResponse.json({
    id: booking.id,
    bookingNumber: booking.bookingNumber,
    status: booking.status,
    totalAmount: booking.totalAmount,
  }, { status: 201 });
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "10");
  const status = searchParams.get("status");

  const isAdmin = (session.user as any).role === "ADMIN" || (session.user as any).role === "SUPER_ADMIN";

  const where = isAdmin
    ? (status ? { status: status as any } : {})
    : { userId: session.user.id, ...(status ? { status: status as any } : {}) };

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      include: {
        car: { select: { name: true, nameAr: true, images: true, brand: true, model: true } },
        user: { select: { name: true, email: true, phone: true } },
        branch: { select: { name: true, nameAr: true } },
        documents: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.booking.count({ where }),
  ]);

  return NextResponse.json({
    bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}
