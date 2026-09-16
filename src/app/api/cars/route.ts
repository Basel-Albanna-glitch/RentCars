import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const carSchema = z.object({
  name: z.string().min(2),
  nameAr: z.string().min(2),
  brand: z.string().min(1),
  model: z.string().min(1),
  year: z.number().int().min(2000).max(2030),
  seats: z.number().int().min(2).max(12),
  fuelType: z.enum(["PETROL", "DIESEL", "HYBRID", "ELECTRIC"]),
  fuelConsumption: z.string().optional(),
  transmission: z.enum(["AUTOMATIC", "MANUAL"]),
  color: z.string().min(2),
  colorAr: z.string().optional(),
  description: z.string().optional(),
  descriptionAr: z.string().optional(),
  // Cloudinary returns absolute URLs; the local-development fallback in
  // /api/upload returns root-relative paths under /uploads.
  images: z.array(z.string().url().or(z.string().startsWith("/uploads/"))).min(1),
  dailyPrice: z.number().positive(),
  weeklyPrice: z.number().positive().optional().nullable(),
  monthlyPrice: z.number().positive().optional().nullable(),
  depositAmount: z.number().min(0),
  branchId: z.string().min(1), // opaque id; the FK enforces that the branch exists
});

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  const page = parseInt(searchParams.get("page") ?? "1");
  const limit = parseInt(searchParams.get("limit") ?? "12");
  const status = searchParams.get("status");
  const branchId = searchParams.get("branchId");
  const transmission = searchParams.get("transmission");
  const fuelType = searchParams.get("fuelType");
  const seats = searchParams.get("seats");
  const minPrice = searchParams.get("minPrice");
  const maxPrice = searchParams.get("maxPrice");
  const sort = searchParams.get("sort") ?? "createdAt_desc";

  const where: any = {};
  if (status) where.status = status;
  else where.status = { not: "OUT_OF_SERVICE" };
  if (branchId) where.branchId = branchId;
  if (transmission) where.transmission = transmission;
  if (fuelType) where.fuelType = fuelType;
  if (seats) where.seats = { gte: parseInt(seats) };
  if (minPrice || maxPrice) {
    where.dailyPrice = {};
    if (minPrice) where.dailyPrice.gte = parseFloat(minPrice);
    if (maxPrice) where.dailyPrice.lte = parseFloat(maxPrice);
  }

  const [sortField, sortDir] = sort.split("_");
  const orderBy: any = { [sortField]: sortDir };

  const [cars, total] = await Promise.all([
    prisma.car.findMany({
      where,
      include: {
        branch: { select: { name: true, nameAr: true, city: true } },
        _count: { select: { bookings: true } },
      },
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.car.count({ where }),
  ]);

  return NextResponse.json({
    cars,
    pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || !["ADMIN", "SUPER_ADMIN"].includes((session.user as any).role)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = carSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: "Validation failed", details: parsed.error.flatten() }, { status: 400 });
  }

  const car = await prisma.car.create({
    data: {
      ...parsed.data,
      status: "AVAILABLE",
    },
    include: { branch: true },
  });

  return NextResponse.json(car, { status: 201 });
}
