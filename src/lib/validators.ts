import { z } from "zod";

/**
 * Shared request schemas. These live outside the route files because a Next.js
 * `route.ts` may only export HTTP method handlers and route config.
 */

export const seasonSchema = z.object({
  name: z.string().min(2).max(100),
  nameAr: z.string().min(2).max(100),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  priceMultiplier: z.number().min(1).max(9.99),
  minDays: z.number().int().min(1).max(90),
  isActive: z.boolean().default(true),
  description: z.string().max(500).optional().nullable(),
  descriptionAr: z.string().max(500).optional().nullable(),
});

export const offerSchema = z.object({
  title: z.string().min(2).max(150),
  titleAr: z.string().min(2).max(150),
  description: z.string().max(1000).optional().nullable(),
  descriptionAr: z.string().max(1000).optional().nullable(),
  discountPercent: z.number().int().min(1).max(100).optional().nullable(),
  discountAmount: z.number().positive().optional().nullable(),
  code: z.string().min(3).max(40).optional().nullable(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  isActive: z.boolean().default(true),
  usageLimit: z.number().int().min(1).optional().nullable(),
});

export const branchSchema = z.object({
  name: z.string().min(2).max(100),
  nameAr: z.string().min(2).max(100),
  address: z.string().min(3).max(200),
  addressAr: z.string().min(3).max(200),
  city: z.string().min(2).max(80),
  lat: z.number().min(-90).max(90),
  lng: z.number().min(-180).max(180),
  phone: z.string().min(6).max(30),
  whatsapp: z.string().min(6).max(30),
  email: z.string().email(),
  emergencyPhone: z.string().min(6).max(30).optional().nullable(),
  isActive: z.boolean().default(true),
});
