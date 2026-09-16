import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const favoriteSchema = z.object({ carId: z.string().min(1) });

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const favorites = await prisma.favorite.findMany({
    where: { userId: session.user.id },
    select: { carId: true },
  });

  return NextResponse.json({ carIds: favorites.map((f) => f.carId) });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = favoriteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  const car = await prisma.car.findUnique({
    where: { id: parsed.data.carId },
    select: { id: true },
  });
  if (!car) {
    return NextResponse.json({ error: "Car not found" }, { status: 404 });
  }

  // Favouriting twice is a no-op rather than a unique-constraint error.
  const favorite = await prisma.favorite.upsert({
    where: { userId_carId: { userId: session.user.id, carId: car.id } },
    update: {},
    create: { userId: session.user.id, carId: car.id },
  });

  return NextResponse.json({ id: favorite.id }, { status: 201 });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = favoriteSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid data" }, { status: 400 });
  }

  await prisma.favorite.deleteMany({
    where: { userId: session.user.id, carId: parsed.data.carId },
  });

  return NextResponse.json({ removed: true });
}
