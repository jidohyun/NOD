interface Window {
  gtag?: (
    command: "event" | "config" | "set",
    targetId: string,
    params?: Record<string, unknown>
  ) => void;
}
