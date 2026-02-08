"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const AUTO_CLOSE_SECONDS = 5;

function ExtensionAuthContent() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [closeIn, setCloseIn] = useState<number | null>(null);
  const searchParams = useSearchParams();

  useEffect(() => {
    const sendTokenToExtension = async () => {
      // Get token from Supabase session (stored in cookies, not localStorage)
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const token = session?.access_token;

      if (!token) {
        setStatus("error");
        return;
      }

      const extId = searchParams.get("ext");

      // Primary: Use chrome.runtime.sendMessage via externally_connectable
      if (extId && typeof chrome !== "undefined" && chrome.runtime?.sendMessage) {
        try {
          chrome.runtime.sendMessage(extId, { type: "SET_TOKEN", token }, (response) => {
            if (chrome.runtime.lastError || !response?.success) {
              fallbackPostMessage(token);
            } else {
              setStatus("success");
            }
          });
          return;
        } catch {
          // Fall through to postMessage fallback
        }
      }

      fallbackPostMessage(token);
    };

    const fallbackPostMessage = (token: string) => {
      let attempts = 0;
      const maxAttempts = 10;

      const trySendToken = () => {
        attempts++;
        window.postMessage({ type: "NOD_AUTH_TOKEN", token }, "*");

        if (attempts < maxAttempts) {
          setTimeout(trySendToken, 500);
        } else {
          setStatus("success");
        }
      };

      setTimeout(trySendToken, 500);
    };

    void sendTokenToExtension();
  }, [searchParams]);

  useEffect(() => {
    if (status !== "success") {
      setCloseIn(null);
      return;
    }

    setCloseIn(AUTO_CLOSE_SECONDS);

    const intervalId = window.setInterval(() => {
      setCloseIn((prev) => {
        if (prev === null) return prev;
        return Math.max(prev - 1, 0);
      });
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      window.close();
    }, AUTO_CLOSE_SECONDS * 1000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [status]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="rounded-lg border bg-card p-8 text-center">
        {status === "loading" && <p>Connecting to extension...</p>}
        {status === "success" && (
          <div>
            <p className="text-lg font-medium text-green-600">Connected!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              You can close this tab and use the extension.
            </p>
            {typeof closeIn === "number" ? (
              <p className="mt-4 text-xs text-muted-foreground">
                This tab will close in {closeIn}s.
              </p>
            ) : null}
          </div>
        )}
        {status === "error" && (
          <div>
            <p className="text-lg font-medium text-destructive">Authentication required</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Please log in first, then try again.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ExtensionAuthPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center">
          <p>Loading...</p>
        </div>
      }
    >
      <ExtensionAuthContent />
    </Suspense>
  );
}
