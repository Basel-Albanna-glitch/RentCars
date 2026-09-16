import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seasonSchema } from "@/lib/validators";

const updateSchema = seasonSchema.partial();

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

  const season = await prisma.season.update({
    where: { id },
    data: {
      ...rest,
      ...(startDate ? { startDate: new Date(startDate) } : {}),
      ...(endDate ? { endDate: new Date(endDate) } : {}),
    },
  });

  return NextResponse.json(season);
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
  await prisma.season.delete({ where: { id } });

  return NextResponse.json({ deleted: true });
}
