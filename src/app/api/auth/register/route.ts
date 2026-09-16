import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(6).max(30).optional(),
  password: z.string().min(6).max(200),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, phone, password } = parsed.data;
  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
    select: { id: true },
  });

  if (existing) {
    return NextResponse.json({ error: "EMAIL_TAKEN" }, { status: 409 });
  }

  const user = await prisma.user.create({
    data: {
      name,
      email: normalizedEmail,
      phone,
      password: await bcrypt.hash(password, 12),
      role: "USER",
    },
    select: { id: true, name: true, email: true },
  });

  return NextResponse.json(user, { status: 201 });
}
