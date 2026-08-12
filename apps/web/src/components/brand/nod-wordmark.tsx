import Image from "next/image";
import { cn } from "@/lib/utils";

interface NodWordmarkProps {
  className?: string;
  priority?: boolean;
  size?: "sm" | "md" | "lg";
}

const SIZE_MAP = {
  sm: { width: 120, height: 30, className: "h-7" },
  md: { width: 140, height: 35, className: "h-8" },
  lg: { width: 160, height: 40, className: "h-10" },
} as const;

export function NodWordmark({ className, priority = false, size = "md" }: NodWordmarkProps) {
  const selected = SIZE_MAP[size];

  return (
    <span className={cn("inline-flex items-center", className)}>
      <Image
        src="/brand/nod-logo-light.png"
        alt="NOD"
        width={selected.width}
        height={selected.height}
        className={cn("w-auto dark:hidden", selected.className)}
        priority={priority}
      />
      <Image
        src="/brand/nod-logo.png"
        alt="NOD"
        width={selected.width}
        height={selected.height}
        className={cn("hidden w-auto dark:block", selected.className)}
        priority={priority}
      />
    </span>
  );
}
