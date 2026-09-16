import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { branchSchema } from "@/lib/validators";

const updateSchema = branchSchema.partial();

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

  const branch = await prisma.branch.update({ where: { id }, data: parsed.data });
  return NextResponse.json(branch);
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

  // Cars and bookings point at branches, so a branch that has been used is
  // deactivated rather than removed.
  const carCount = await prisma.car.count({ where: { branchId: id } });

  if (carCount > 0) {
    const branch = await prisma.branch.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ deactivated: true, isActive: branch.isActive });
  }

  await prisma.branch.delete({ where: { id } });
  return NextResponse.json({ deleted: true });
}
