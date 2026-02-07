"use client"

import Link from 'next/link'
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import {
  LayoutDashboard,
  FileText,
  Settings,
  CreditCard,
  LogOut,
  User as UserIcon,
  HelpCircle,
} from 'lucide-react'
import { createClient } from "@/lib/supabase/client"
import { signOut } from "@/lib/auth/auth-client"
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const NAV_ITEMS = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/articles", icon: FileText, label: "Articles" },
] as const

const BOTTOM_NAV_ITEMS = [
  { href: "/settings", icon: Settings, label: "Settings" },
  { href: "/settings/billing", icon: CreditCard, label: "Billing" },
] as const

export function DashboardSidebar() {
  const router = useRouter()
  const pathname = usePathname()
  const [mounted, setMounted] = useState(false)
  const [userName, setUserName] = useState("")
  const [userEmail, setUserEmail] = useState("")
  const [avatarUrl, setAvatarUrl] = useState("")

  useEffect(() => {
    setMounted(true)
    const supabase = createClient()
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const meta = user.user_metadata
        setUserName(meta?.full_name ?? meta?.name ?? user.email?.split("@")[0] ?? "")
        setUserEmail(user.email ?? "")
        setAvatarUrl(meta?.avatar_url ?? meta?.picture ?? "")
      }
    })
  }, [])

  const initials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)

  function isActive(href: string) {
    // Strip locale prefix (e.g., /ko/articles → /articles)
    const path = pathname.replace(/^\/[a-z]{2}(?=\/|$)/, "") || "/"
    if (href === "/dashboard") {
      return path === "/dashboard" || path === "/"
    }
    if (href === "/settings/billing") {
      return path === "/settings/billing"
    }
    return path.startsWith(href)
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
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => (
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

        {BOTTOM_NAV_ITEMS.map(({ href, icon: Icon, label }) => (
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
              <button className="flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-accent">
                <Avatar size="sm">
                  {avatarUrl && (
                    <AvatarImage src={avatarUrl} alt={userName} referrerPolicy="no-referrer" />
                  )}
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
                  <span>Profile</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings")}>
                  <Settings />
                  <span>Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => router.push("/settings/billing")}>
                  <CreditCard />
                  <span>Billing</span>
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <HelpCircle />
                <span>Help</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onClick={async () => {
                  await signOut()
                  router.push("/login")
                }}
              >
                <LogOut />
                <span>Log out</span>
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
  )
}
