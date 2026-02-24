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
      className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
        isActive
          ? "cm-doodle-border rounded-xl bg-nod-gold/10 text-nod-gold font-creative-body font-bold"
          : "rounded-xl text-cm-text-light font-creative-body font-semibold hover:bg-nod-gold/5 hover:text-cm-text"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}
