interface LoadingProps {
  message?: string;
}

export function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <div className="glass-card animate-fade-in py-7 text-center">
      <div className="cm-icon-badge relative mx-auto h-10 w-10">
        <div className="h-6 w-6 rounded-full border-2" style={{ borderColor: "var(--spinner-ring)" }} />
        <div className="absolute h-6 w-6 animate-spin rounded-full border-2 border-transparent border-t-[#E8B931]" />
      </div>
      <p className="mt-3 text-xs font-semibold t-muted">{message}</p>
    </div>
  );
}
