export function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground selection:bg-nod-gold selection:text-white">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,_rgba(196,154,28,0.24)_1px,_transparent_0)] bg-[size:24px_24px] opacity-45 dark:opacity-20" />
      <div className="pointer-events-none absolute top-[-120px] right-[-90px] h-[300px] w-[300px] rounded-full bg-cm-mint/55 blur-3xl animate-cm-float dark:bg-nod-gold/10" />
      <div className="pointer-events-none absolute bottom-[-140px] left-[-80px] h-[320px] w-[320px] rounded-full bg-cm-lavender/65 blur-3xl animate-cm-float-reverse dark:bg-white/5" />
      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-6xl flex-col px-8 pb-10 pt-8">
        {children}
      </div>
    </div>
  );
}
