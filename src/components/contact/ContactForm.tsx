"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";
import { Loader2, Send } from "lucide-react";

const schema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(3),
  message: z.string().min(10),
});

type ContactValues = z.infer<typeof schema>;

export function ContactForm({ locale }: { locale: string }) {
  const t = useTranslations("contact");
  const isAr = locale === "ar";
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(schema) });

  async function onSubmit(values: ContactValues) {
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) throw new Error("Request failed");

      toast.success(t("messageSent"));
      setSent(true);
      reset();
    } catch {
      toast.error(isAr ? "تعذر إرسال الرسالة، حاول مرة أخرى" : "Could not send your message, please try again");
    }
  }

  const invalid = isAr ? "هذا الحقل مطلوب أو غير صحيح" : "This field is required or invalid";

  return (
    <div className="card p-6 sm:p-8">
      <h2 className="text-xl font-bold text-dark-950 mb-6">{t("sendMessage")}</h2>

      {sent && (
        <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl px-4 py-3 text-sm mb-6">
          {t("messageSent")}
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-5">
          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-2">{t("yourName")}</span>
            <input {...register("name")} className="input-field" autoComplete="name" />
            {errors.name && <span className="text-red-500 text-xs mt-1 block">{invalid}</span>}
          </label>

          <label className="block">
            <span className="block text-sm font-medium text-gray-700 mb-2">{t("yourEmail")}</span>
            <input {...register("email")} type="email" className="input-field" autoComplete="email" dir="ltr" />
            {errors.email && <span className="text-red-500 text-xs mt-1 block">{invalid}</span>}
          </label>
        </div>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">{t("subject")}</span>
          <input {...register("subject")} className="input-field" />
          {errors.subject && <span className="text-red-500 text-xs mt-1 block">{invalid}</span>}
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-gray-700 mb-2">{t("message")}</span>
          <textarea {...register("message")} rows={6} className="input-field resize-none" />
          {errors.message && <span className="text-red-500 text-xs mt-1 block">{invalid}</span>}
        </label>

        <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-4">
          {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          {t("send")}
        </button>
      </form>
    </div>
  );
}
