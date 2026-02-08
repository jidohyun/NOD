"use client";

import { CreditCard, HelpCircle, LogOut, Settings, User as UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { useRouter } from "@/lib/i18n/routing";
import { createClient } from "@/lib/supabase/client";

interface UserData {
  email: string;
  name: string;
  avatarUrl: string;
}

export function UserMenu() {
  const t = useTranslations("dashboard");
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        const meta = authUser.user_metadata;
        setUser({
          email: authUser.email ?? "",
          name: meta?.full_name ?? meta?.name ?? authUser.email?.split("@")[0] ?? "",
          avatarUrl: meta?.avatar_url ?? meta?.picture ?? "",
        });
      }
      setIsLoading(false);
    });
  }, []);

  const handleLogout = async () => {
    await signOut();
    router.push("/login");
  };

  if (isLoading) {
    return (
      <Button variant="ghost" size="icon" disabled>
        <UserIcon className="h-5 w-5 animate-pulse" />
      </Button>
    );
  }

  if (!user) {
    return (
      <Button variant="ghost" size="icon" onClick={() => router.push("/login")}>
        <UserIcon className="h-5 w-5" />
      </Button>
    );
  }

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full">
          <Avatar size="sm">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.name} referrerPolicy="no-referrer" />
            ) : null}
            <AvatarFallback>{initials || "U"}</AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{user.name}</p>
            <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <UserIcon />
            <span>{t("sidebar.user.profile")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
            <Settings />
            <span>{t("sidebar.user.settings")}</span>
          </DropdownMenuItem>
          <DropdownMenuItem>
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
        <DropdownMenuItem variant="destructive" onClick={handleLogout}>
          <LogOut />
          <span>{t("sidebar.user.logout")}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
