import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { branchSchema } from "@/lib/validators";

/** Public: the branch picker on the storefront needs this list. */
export async function GET() {
  const branches = await prisma.branch.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      nameAr: true,
      city: true,
      address: true,
      addressAr: true,
      phone: true,
      whatsapp: true,
      email: true,
      lat: true,
      lng: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ branches });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = branchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const branch = await prisma.branch.create({ data: parsed.data });
  return NextResponse.json(branch, { status: 201 });
}
