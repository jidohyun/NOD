import type { Locale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { SettingsProfile } from "@/components/settings/settings-profile";

interface SettingsPageProps {
  params: Promise<{ locale: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { locale } = await params;
  setRequestLocale(locale as Locale);

  return (
    <div className="mx-auto max-w-5xl py-8 px-4">
      <SettingsProfile />
    </div>
  );
}
