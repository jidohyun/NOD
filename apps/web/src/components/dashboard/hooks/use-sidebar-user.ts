"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";

function initialsFromName(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function useSidebarUser() {
  const [mounted, setMounted] = useState(false);
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

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

  const initials = useMemo(() => initialsFromName(userName), [userName]);

  return { mounted, userName, userEmail, avatarUrl, initials };
}
