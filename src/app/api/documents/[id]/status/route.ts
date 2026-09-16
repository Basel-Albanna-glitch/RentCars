import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const statusSchema = z.object({
  status: z.enum(["PENDING", "APPROVED", "REJECTED", "REUPLOAD_REQUIRED"]),
  adminNote: z.string().max(1000).optional().nullable(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  const role = session?.user?.role;

  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
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

  const document = await prisma.document.findUnique({
    where: { id },
    select: { id: true, booking: { select: { branchId: true } } },
  });

  if (!document) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (
    role === "ADMIN" &&
    session.user.branchId &&
    session.user.branchId !== document.booking.branchId
  ) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const updated = await prisma.document.update({
    where: { id },
    data: {
      status: parsed.data.status,
      ...(parsed.data.adminNote !== undefined ? { adminNote: parsed.data.adminNote } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    status: updated.status,
    adminNote: updated.adminNote,
  });
}
