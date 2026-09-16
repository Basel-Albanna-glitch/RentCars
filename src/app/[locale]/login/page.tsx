import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";
import { auth } from "@/lib/auth";

export default async function LoginPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const { locale } = await params;
  const { callbackUrl } = await searchParams;

  const session = await auth();
  if (session) {
    redirect(callbackUrl ?? `/${locale}/dashboard`);
  }

  const t = await getTranslations("auth");
  const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID);

  return (
    <AuthShell
      locale={locale}
      title={t("login")}
      subtitle={
        locale === "ar"
          ? "سجّل دخولك لمتابعة حجوزاتك ونقاطك"
          : "Sign in to track your bookings and points"
      }
    >
      <LoginForm
        locale={locale}
        callbackUrl={callbackUrl ?? `/${locale}/dashboard`}
        googleEnabled={googleEnabled}
      />
    </AuthShell>
  );
}
