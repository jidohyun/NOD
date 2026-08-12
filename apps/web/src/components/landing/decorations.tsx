import { cn } from "@/lib/utils";

interface OrganicBlobProps {
  color?: string;
  size?: string;
  className?: string;
}

export function OrganicBlob({
  color = "bg-cm-mint",
  size = "w-64 h-64",
  className,
}: OrganicBlobProps) {
  return (
    <div
      className={cn(
        "cm-organic-shape opacity-40 blur-3xl pointer-events-none",
        color,
        size,
        className
      )}
      aria-hidden="true"
    />
  );
}

interface FloatingCircleProps {
  color?: string;
  size?: string;
  className?: string;
  reverse?: boolean;
}

export function FloatingCircle({
  color = "bg-nod-gold/20",
  size = "w-8 h-8",
  className,
  reverse = false,
}: FloatingCircleProps) {
  return (
    <div
      className={cn(
        "rounded-full pointer-events-none",
        reverse ? "animate-cm-float-reverse" : "animate-cm-float",
        color,
        size,
        className
      )}
      aria-hidden="true"
    />
  );
}

interface WavyUnderlineProps {
  color?: string;
  className?: string;
}

export function WavyUnderline({ color = "#e0f2f1", className }: WavyUnderlineProps) {
  return (
    <svg
      className={cn("absolute -bottom-2 left-0 w-full", className)}
      viewBox="0 0 200 12"
      fill="none"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        d="M0 8c30-8 40 4 66.7-2s36.6 6 66.6-2S170 10 200 4"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

interface StickyNoteProps {
  color?: string;
  children: React.ReactNode;
  className?: string;
  rotate?: string;
}

export function StickyNote({
  color = "bg-nod-gold/10",
  children,
  className,
  rotate = "rotate-3",
}: StickyNoteProps) {
  return (
    <div
      className={cn(
        "rounded-lg px-4 py-3 text-sm font-creative-body font-semibold text-cm-text shadow-md pointer-events-none select-none",
        color,
        rotate,
        className
      )}
      aria-hidden="true"
    >
      {children}
    </div>
  );
}

interface DoodleConnectorProps {
  className?: string;
}

export function DoodleConnector({ className }: DoodleConnectorProps) {
  return (
    <svg
      className={cn("text-nod-gold/30", className)}
      viewBox="0 0 80 20"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M0 10c10-8 20 8 30-2s20 8 30-2 10 8 20-2"
        stroke="currentColor"
        strokeWidth="2"
        strokeDasharray="6 4"
        strokeLinecap="round"
      />
    </svg>
  );
}
