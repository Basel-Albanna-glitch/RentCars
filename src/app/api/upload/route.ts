import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import { auth } from "@/lib/auth";

const MAX_BYTES = 10 * 1024 * 1024; // 10MB, matching the hint shown in the wizard
const ALLOWED = ["image/jpeg", "image/png", "image/webp"];

const cloudinaryConfigured = Boolean(
  process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

async function uploadToCloudinary(buffer: Buffer, folder: string): Promise<string> {
  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream({ folder, resource_type: "image" }, (error, result) => {
        if (error || !result) return reject(error ?? new Error("Upload failed"));
        resolve(result.secure_url);
      })
      .end(buffer);
  });
}

/**
 * Writes the file under `public/uploads` and returns the path it will be served
 * from. This is the fallback for local development, where Cloudinary is not
 * configured; on a read-only production filesystem it will fail, which is the
 * signal that Cloudinary credentials are missing.
 */
async function uploadToPublicDir(buffer: Buffer, filename: string): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads");
  await mkdir(dir, { recursive: true });
  await writeFile(path.join(dir, filename), buffer);
  return `/uploads/${filename}`;
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData().catch(() => null);
  const file = form?.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }

  if (!ALLOWED.includes(file.type)) {
    return NextResponse.json(
      { error: "Unsupported file type", allowed: ALLOWED },
      { status: 415 }
    );
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File is larger than 10MB" }, { status: 413 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const filename = `${session.user.id}-${randomUUID()}.${extension}`;

  try {
    const url = cloudinaryConfigured
      ? await uploadToCloudinary(buffer, "drive-jordan/documents")
      : await uploadToPublicDir(buffer, filename);

    return NextResponse.json({ url, storage: cloudinaryConfigured ? "cloudinary" : "local" });
  } catch (error) {
    console.error("[upload] failed:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
