import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { seasonSchema } from "@/lib/validators";

export async function GET() {
  const session = await auth();
  const role = session?.user?.role;

  if (!session || (role !== "ADMIN" && role !== "SUPER_ADMIN")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const seasons = await prisma.season.findMany({ orderBy: { startDate: "asc" } });
  return NextResponse.json({ seasons });
}

export async function POST(req: NextRequest) {
  const session = await auth();

  // Seasons change pricing across every branch, so only a super admin sets them.
  if (!session || session.user.role !== "SUPER_ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = seasonSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { startDate, endDate, ...rest } = parsed.data;
  if (new Date(endDate) <= new Date(startDate)) {
    return NextResponse.json({ error: "endDate must come after startDate" }, { status: 400 });
  }

  const season = await prisma.season.create({
    data: { ...rest, startDate: new Date(startDate), endDate: new Date(endDate) },
  });

  return NextResponse.json(season, { status: 201 });
}
