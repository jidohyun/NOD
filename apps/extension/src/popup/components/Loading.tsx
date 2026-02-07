interface LoadingProps {
  message?: string;
}

export function Loading({ message = "Loading..." }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative">
        <div className="h-8 w-8 rounded-full border-2 border-gray-100" />
        <div className="absolute top-0 left-0 h-8 w-8 animate-spin rounded-full border-2 border-transparent border-t-[#E8B931]" />
      </div>
      <p className="mt-3 text-xs text-gray-500">{message}</p>
    </div>
  );
}
