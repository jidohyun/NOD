"use client";

import {
  CreditCard,
  FileText,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  MessageSquare,
  Settings,
  Tag,
  User as UserIcon,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { NodWordmark } from "@/components/brand/nod-wordmark";
import { useSidebarUser } from "@/components/dashboard/hooks/use-sidebar-user";
import { SidebarNavLink } from "@/components/dashboard/sidebar-nav-link";
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

const LOCALE_PREFIX_RE = /^\/[a-z]{2}(?=\/|$)/;

export function DashboardSidebar() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const pathname = usePathname();
  const { mounted, userName, userEmail, avatarUrl, initials } = useSidebarUser();
  const navItems = [
    { href: "/dashboard", icon: LayoutDashboard, label: t("sidebar.nav.dashboard") },
    { href: "/articles", icon: FileText, label: t("sidebar.nav.articles") },
  ];

  const bottomNavItems = [
    { href: "/settings", icon: Settings, label: t("sidebar.nav.settings") },
    { href: "/settings/billing", icon: CreditCard, label: t("sidebar.nav.billing") },
    { href: "/pricing", icon: Tag, label: t("sidebar.nav.pricing") },
  ] as const;

  const basePath = pathname.replace(LOCALE_PREFIX_RE, "") || "/";
  function isActive(href: string) {
    // Strip locale prefix (e.g., /ko/articles → /articles)
    if (href === "/dashboard") {
      return basePath === "/dashboard" || basePath === "/";
    }
    if (href === "/settings/billing") {
      return basePath === "/settings/billing";
    }
    if (href === "/settings") {
      return basePath === "/settings";
    }
    return basePath.startsWith(href);
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r bg-background">
      {/* Brand/Logo */}
      <div className="flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="inline-flex items-center">
          <NodWordmark size="sm" priority />
          <span className="sr-only">NOD</span>
        </Link>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map(({ href, icon: Icon, label }) => (
          <SidebarNavLink
            key={href}
            href={href}
            icon={Icon}
            label={label}
            isActive={isActive(href)}
          />
        ))}

        <div className="my-3 border-t" />

        {bottomNavItems.map(({ href, icon: Icon, label }) => (
          <SidebarNavLink
            key={href}
            href={href}
            icon={Icon}
            label={label}
            isActive={isActive(href)}
          />
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
              <DropdownMenuItem onClick={() => router.push("/blog/web-clipper-guide")}>
                <HelpCircle />
                <span>{t("sidebar.user.help")}</span>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a
                  href="https://nodarchive.featurebase.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageSquare />
                  <span>{t("sidebar.user.feedback")}</span>
                </a>
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
