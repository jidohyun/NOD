"use client";

import {
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Settings,
  Tag,
  User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { signOut } from "@/lib/auth/auth-client";
import { Link, usePathname, useRouter } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/client";

const LOCALE_PREFIX_RE = /^\/[a-z]{2}(?=\/|$)/;

export function DashboardSidebar() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("sidebar.nav.dashboard") },
    { href: "/articles", icon: FileText, label: t("sidebar.nav.articles") },
  ] as const;

  const bottomNavItems = [
    { href: "/settings", icon: Settings, label: t("sidebar.nav.settings") },
    { href: "/settings/billing", icon: CreditCard, label: t("sidebar.nav.billing") },
    { href: "/pricing", icon: Tag, label: t("sidebar.nav.pricing") },
  ] as const;

  useEffect(() => {
    setMounted(true);
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = user.user_metadata;
        setUserName(meta?.full_name ?? meta?.name ?? user.email?.split("@")[0] ?? "");
        setUserEmail(user.email ?? "");
        setAvatarUrl(meta?.avatar_url ?? meta?.picture ?? "");
      }
    });
  }, []);

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  function isActive(href: string) {
    // Strip locale prefix (e.g., /ko/articles → /articles)
    const path = pathname.replace(LOCALE_PREFIX_RE, "") || "/";
    if (href === "/dashboard") {
      return path === "/dashboard" || path === "/";
    }
    if (href === "/settings/billing") {
      return path === "/settings/billing";
    }
    if (href === "/settings") {
      return path === "/settings";
    }
    return path.startsWith(href);
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      {/* Brand/Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="text-xl font-bold">
          NOD
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}

        <div className="my-3 border-t" />

        {bottomNavItems.map(({ href, icon: Icon, label }) => (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              isActive(href)
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>

      {/* User Section - rendered client-only to avoid Radix ID hydration mismatch */}
      <div data-testid="user-section" className="border-t p-4">
        {mounted ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent"
              >
                <Avatar size="sm">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt={userName} referrerPolicy="no-referrer" />
                  ) : null}
                  <AvatarFallback>{initials || "U"}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0 text-left">
                  <p className="truncate text-sm font-medium">{userName}</p>
                  <p className="truncate text-xs text-muted-foreground">{userEmail}</p>
                </div>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="start" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{userName}</p>
                  <p className="text-xs leading-none text-muted-foreground">{userEmail}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <UserIcon />
                  <span>{t("sidebar.user.profile")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings />
                  <span>{t("sidebar.user.settings")}</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings/billing")}>
                  <CreditCard />
                  <span>{t("sidebar.user.billing")}</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle />
                <span>{t("sidebar.user.help")}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  await signOut();
                  router.push("/login");
                }}
              >
                <LogOut />
                <span>{t("sidebar.user.logout")}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2">
            <Avatar size="sm">
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0 text-left">
              <div className="h-4 w-20 animate-pulse rounded bg-muted" />
              <div className="mt-1 h-3 w-28 animate-pulse rounded bg-muted" />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
