import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateCarSchema = z.object({
  name: z.string().min(2).optional(),
  nameAr: z.string().min(2).optional(),
  brand: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  year: z.number().int().min(2000).max(2030).optional(),
  seats: z.number().int().min(2).max(12).optional(),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC"]).optional(),
  fuelConsumption: z.string().optional().nullable(),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]).optional(),
  color: z.string().min(2).optional(),
  colorAr: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  descriptionAr: z.string().optional().nullable(),
  images: z.array(z.string().min(1)).min(1).optional(),
  status: z.enum(["AVAILABLE", "BOOKED", "MAINTENANCE", "OUT_OF_SERVICE"]).optional(),
  dailyPrice: z.number().positive().optional(),
  weeklyPrice: z.number().positive().nullable().optional(),
  monthlyPrice: z.number().positive().nullable().optional(),
  depositAmount: z.number().min(0).optional(),
  branchId: z.string().min(1).optional(),
});

function isAdmin(role?: string) {
  return role === "ADMIN" || role === "SUPER_ADMIN";
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const car = await prisma.car.findUnique({
    where: { id },
    include: { branch: { select: { id: true, name: true, nameAr: true, city: true } } },
  });

  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  return NextResponse.json(car);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || !isAdmin(session.user.role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = updateCarSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const existing = await prisma.car.findUnique({
    where: { id },
    select: { branchId: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  // A branch admin may only touch cars that belong to their own branch.
  if (session.user.role === "ADMIN" && session.user.branchId !== existing.branchId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const car = await prisma.car.update({
    where: { id },
    data: parsed.data,
    include: { branch: { select: { name: true, nameAr: true } } },
  });

  return NextResponse.json(car);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // Bookings reference cars, so retiring is the only safe option once a car has
  // history. Only a car nobody ever booked is actually deleted.
  const bookingCount = await prisma.booking.count({ where: { carId: id } });

  if (bookingCount > 0) {
    const car = await prisma.car.update({
      where: { id },
      data: { status: "OUT_OF_SERVICE" },
    });
    return NextResponse.json({ retired: true, status: car.status });
  }

  await prisma.favorite.deleteMany({ where: { carId: id } });
  await prisma.car.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
