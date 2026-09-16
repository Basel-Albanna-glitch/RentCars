import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { differenceInDays, format, isWithinInterval } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(amount: number, locale = "ar-JO") {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "JOD",
    minimumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string, locale = "ar") {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "dd/MM/yyyy");
}

export function calculateBookingDays(start: Date, end: Date): number {
  return Math.max(1, differenceInDays(end, start));
}

export function calculateBookingPrice({
  dailyPrice,
  weeklyPrice,
  monthlyPrice,
  days,
  seasonMultiplier = 1,
}: {
  dailyPrice: number;
  weeklyPrice?: number | null;
  monthlyPrice?: number | null;
  days: number;
  seasonMultiplier?: number;
}): number {
  let basePrice: number;

  if (days >= 30 && monthlyPrice) {
    const months = Math.floor(days / 30);
    const remainingDays = days % 30;
    basePrice = months * monthlyPrice + remainingDays * dailyPrice;
  } else if (days >= 7 && weeklyPrice) {
    const weeks = Math.floor(days / 7);
    const remainingDays = days % 7;
    basePrice = weeks * weeklyPrice + remainingDays * dailyPrice;
  } else {
    basePrice = days * dailyPrice;
  }

  return basePrice * seasonMultiplier;
}

export function pointsToDiscount(points: number): number {
  // 100 points = 1 JD discount
  return Math.floor(points / 100);
}

export function bookingToPoints(totalAmount: number): number {
  // 1 JD = 10 points
  return Math.floor(totalAmount * 10);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    APPROVED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-gray-100 text-gray-800",
    AVAILABLE: "bg-green-100 text-green-800",
    BOOKED: "bg-red-100 text-red-800",
    MAINTENANCE: "bg-orange-100 text-orange-800",
    OUT_OF_SERVICE: "bg-gray-100 text-gray-800",
  };
  return colors[status] ?? "bg-gray-100 text-gray-800";
}

export function isDateInSeason(
  date: Date,
  season: { startDate: Date; endDate: Date }
): boolean {
  return isWithinInterval(date, {
    start: season.startDate,
    end: season.endDate,
  });
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .trim();
}

/**
 * Prisma returns Decimal instances for `Decimal` columns, and those cannot be
 * handed to a Client Component ("Only plain objects can be passed to Client
 * Components"). Deep-convert them to numbers while leaving Dates untouched.
 */
export function serializeDecimals<T>(value: T): T {
  if (value === null || typeof value !== "object") return value;
  if (value instanceof Date) return value;

  if (Array.isArray(value)) {
    return value.map(serializeDecimals) as unknown as T;
  }

  const maybeDecimal = value as { toNumber?: () => number };
  if (typeof maybeDecimal.toNumber === "function") {
    return maybeDecimal.toNumber() as unknown as T;
  }

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([k, v]) => [
      k,
      serializeDecimals(v),
    ])
  ) as T;
}
