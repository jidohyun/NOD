"use client";

import type { ElementType } from "react";
import { Link } from "@/lib/i18n/routing";

export function SidebarNavLink({
  href,
  icon: Icon,
  label,
  isActive,
}: {
  href: string;
  icon: ElementType<{ className?: string }>;
  label: string;
  isActive: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
        isActive
          ? "bg-primary/10 text-primary font-semibold"
          : "text-muted-foreground hover:bg-primary/5 hover:text-foreground"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
