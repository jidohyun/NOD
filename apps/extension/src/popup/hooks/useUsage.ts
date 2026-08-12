import { useState, useEffect } from "react";
import { getUsageInfo, type UsageInfo } from "../../lib/api";
import { isAuthenticated } from "../../lib/auth";

export function useUsage() {
  const [usage, setUsage] = useState<UsageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = async () => {
    const authed = await isAuthenticated();
    if (!authed) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getUsageInfo();
      setUsage(data);
    } catch {
      // Silently fail - usage display is non-critical
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  return { usage, isLoading, refresh };
}
