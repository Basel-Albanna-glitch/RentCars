"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { signIn } from "next-auth/react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { useState } from "react";
import { Eye, EyeOff, Loader2 } from "lucide-react";

const schema = z
  .object({
    name: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6).optional().or(z.literal("")),
    password: z.string().min(6),
    confirmPassword: z.string().min(6),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "mismatch",
  });

type RegisterValues = z.infer<typeof schema>;

export function RegisterForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const router = useRouter();
  const isAr = locale === "ar";
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: RegisterValues) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: values.name,
        email: values.email,
        phone: values.phone || undefined,
        password: values.password,
      }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      toast.error(
        body.error === "EMAIL_TAKEN"
          ? isAr
            ? "هذا البريد الإلكتروني مسجّل مسبقاً"
            : "That email is already registered"
          : isAr
          ? "تعذر إنشاء الحساب، حاول مرة أخرى"
          : "Could not create the account, please try again"
      );
      return;
    }

    toast.success(t("registerSuccess"));

    // Log the new account straight in so they land on the dashboard.
    await signIn("credentials", {
      email: values.email,
      password: values.password,
      redirect: false,
    });

    router.push(`/${locale}/dashboard`);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">{t("name")}</span>
          <input {...register("name")} autoComplete="name" className="input-field" />
          {errors.name && (
            <span className="text-red-500 text-xs mt-1 block">
              {isAr ? "أدخل اسمك الكامل" : "Enter your full name"}
            </span>
          )}
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">{t("email")}</span>
          <input
            {...register("email")}
            type="email"
            dir="ltr"
            autoComplete="email"
            className="input-field"
            placeholder="you@example.com"
          />
          {errors.email && (
            <span className="text-red-500 text-xs mt-1 block">
              {isAr ? "أدخل بريداً إلكترونياً صحيحاً" : "Enter a valid email address"}
            </span>
          )}
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">{t("phone")}</span>
          <input
            {...register("phone")}
            type="tel"
            dir="ltr"
            autoComplete="tel"
            className="input-field"
            placeholder="+962 7 ..."
          />
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">{t("password")}</span>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete="new-password"
              className="input-field pe-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 end-3 flex items-center text-gray-400 hover:text-gray-600"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <span className="text-red-500 text-xs mt-1 block">
              {isAr ? "كلمة المرور 6 أحرف على الأقل" : "Password must be at least 6 characters"}
            </span>
          )}
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">
            {t("confirmPassword")}
          </span>
          <input
            {...register("confirmPassword")}
            type={showPassword ? "text" : "password"}
            dir="ltr"
            autoComplete="new-password"
            className="input-field"
          />
          {errors.confirmPassword && (
            <span className="text-red-500 text-xs mt-1 block">
              {isAr ? "كلمتا المرور غير متطابقتين" : "Passwords do not match"}
            </span>
          )}
        </label>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("registerBtn")}
        </button>
      </form>

      <p className="text-center text-sm text-gray-500">
        {t("hasAccount")}{" "}
        <Link href={`/${locale}/login`} className="text-primary-700 font-medium hover:underline">
          {t("login")}
        </Link>
      </p>
    </div>
  );
}
