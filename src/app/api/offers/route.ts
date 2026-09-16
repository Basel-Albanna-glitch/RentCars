import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { offerSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;

  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offers = await prisma.offer.findMany({ orderBy: { startDate: "desc" } });
  return NextResponse.json({ offers });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = offerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { startDate, endDate, discountPercent, discountAmount, ...rest } = parsed.data;

  if (new Date(endDate) <= new Date(startDate)) {
    return NextResponse.json({ error: "endDate must come after startDate" }, { status: 400 });
  }

  // An offer that discounts nothing is a configuration mistake, not a valid row.
  if (!discountPercent && !discountAmount) {
    return NextResponse.json(
      { error: "Set either discountPercent or discountAmount" },
      { status: 400 }
    );
  }

  const offer = await prisma.offer.create({
    data: {
      ...rest,
      discountPercent,
      discountAmount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
    },
  });

  return NextResponse.json(offer, { status: 201 });
}
