import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Resend } from "resend";

const contactSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  subject: z.string().min(3).max(200),
  message: z.string().min(10).max(5000),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { name, email, subject, message } = parsed.data;
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const to = process.env.CONTACT_INBOX ?? "info@drivejordan.jo";

  // Without Resend credentials there is nowhere to send the message, so log it
  // and still report success: local development has no mail transport.
  if (!apiKey || !from) {
    console.info("[contact] no mail transport configured, message logged:", {
      name,
      email,
      subject,
      message,
    });
    return NextResponse.json({ delivered: false, logged: true });
  }

  try {
    const resend = new Resend(apiKey);
    await resend.emails.send({
      from,
      to,
      replyTo: email,
      subject: `[South Rent Car] ${subject}`,
      text: `From: ${name} <${email}>\n\n${message}`,
    });

    return NextResponse.json({ delivered: true });
  } catch (error) {
    console.error("[contact] send failed:", error);
    return NextResponse.json({ error: "Could not send message" }, { status: 502 });
  }
}
