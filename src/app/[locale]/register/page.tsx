import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";
import { auth } from "@/lib/auth";

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const session = await auth();
  if (session) {
    redirect(`/${locale}/dashboard`);
  }

  const t = await getTranslations("auth");

  return (
    <AuthShell
      locale={locale}
      title={t("register")}
      subtitle={
        locale === "ar"
          ? "أنشئ حسابك في دقيقة وابدأ الحجز"
          : "Create your account in a minute and start booking"
      }
    >
      <RegisterForm locale={locale} />
    </AuthShell>
  );
}
