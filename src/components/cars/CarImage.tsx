"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface CarImageProps {
  src?: string | null;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
  /** Tailwind text size for the fallback glyph, e.g. "text-6xl". */
  fallbackSize?: string;
}

/**
 * Car photos come from Cloudinary or an admin-supplied URL, so a dead link is a
 * normal state rather than an exception. Both "no image" and "image failed to
 * load" fall back to the same placeholder instead of a broken-image icon.
 */
export function CarImage({
  src,
  alt,
  sizes,
  className,
  priority,
  fallbackSize = "text-6xl",
}: CarImageProps) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
        <span className={fallbackSize} role="img" aria-label={alt}>
          🚗
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
