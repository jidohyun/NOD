import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

export default async function PrivacyRedirectPage() {
  const locale = await getLocale();
  redirect(`/${locale}/privacy`);
}
