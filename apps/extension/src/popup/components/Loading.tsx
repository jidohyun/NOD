interface LoadingProps {
  message?: string;
}

export function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8 animate-fade-in">
      <div className="relative">
        <div className="h-8 w-8 rounded-full border-2" style={{ borderColor: "var(--spinner-ring)" }} />
        <div className="absolute top-0 left-0 h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-[#E8B931]" />
      </div>
      <p className="mt-3 text-xs t-muted">{message}</p>
    </div>
  );
}
