import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { offerSchema } from "@/lib/validators";

const updateSchema = offerSchema.partial();

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const parsed = updateSchema.safeParse(await req.json().catch(() => null));

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { startDate, endDate, ...rest } = parsed.data;

  const offer = await prisma.offer.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
    },
  });

  return NextResponse.json(offer);
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
  await prisma.offer.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
