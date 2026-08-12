import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SettingsProfile } from "@/components/settings/settings-profile";
import { isAdminUserId } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const showAdminPromoEntry = isAdminUserId(user?.id);

  return (
    <div className="mx-auto max-w-5xl py-8 px-4">
      <SettingsProfile showAdminPromoEntry={showAdminPromoEntry} />
    </div>
  );
}
