import { notFound } from "next/navigation";
import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { AdminPromoCodesPage } from "@/components/admin/promo-codes/admin-promo-codes-page";
import { isAdminUserId } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

interface PromoCodesAdminPageProps {
  params: Promise<{ locale: string }>;
}

export default async function PromoCodesAdminPage({ params }: PromoCodesAdminPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !isAdminUserId(user.id)) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <AdminPromoCodesPage />
    </div>
  );
}
