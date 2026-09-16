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

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

type LoginValues = z.infer<typeof schema>;

interface LoginFormProps {
  locale: string;
  callbackUrl: string;
  googleEnabled: boolean;
}

export function LoginForm({ locale, callbackUrl, googleEnabled }: LoginFormProps) {
  const t = useTranslations("auth");
  const router = useRouter();
  const isAr = locale === "ar";
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: LoginValues) {
    const res = await signIn("credentials", {
      ...values,
      redirect: false,
    });

    if (res?.error) {
      toast.error(
        isAr ? "البريد الإلكتروني أو كلمة المرور غير صحيحة" : "Invalid email or password"
      );
      return;
    }

    toast.success(t("loginSuccess"));
    router.push(callbackUrl);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
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
          <span className="block text-sm font-medium text-gray-700 mb-2">{t("password")}</span>
          <div className="relative">
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              dir="ltr"
              autoComplete="current-password"
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

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4">
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {t("loginBtn")}
        </button>
      </form>

      {googleEnabled && (
        <>
          <div className="flex items-center gap-4">
            <span className="h-px bg-gray-200 flex-1" />
            <span className="text-xs text-gray-400">{t("orContinueWith")}</span>
            <span className="h-px bg-gray-200 flex-1" />
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl })}
            className="btn-secondary w-full py-4 border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            {t("google")}
          </button>
        </>
      )}

      <p className="text-center text-sm text-gray-500">
        {t("noAccount")}{" "}
        <Link href={`/${locale}/register`} className="text-primary-700 font-medium hover:underline">
          {t("register")}
        </Link>
      </p>
    </div>
  );
}
