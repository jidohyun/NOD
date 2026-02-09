export type ExtensionPingResult = {
  installed: boolean;
  authenticated: boolean;
};

export async function pingExtension(): Promise<ExtensionPingResult> {
  return await new Promise<ExtensionPingResult>((resolve) => {
    let settled = false;

    function finish(result: ExtensionPingResult) {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      resolve(result);
    }

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type !== "NOD_PONG") return;
      finish({ installed: true, authenticated: Boolean(event.data?.authenticated) });
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: "NOD_PING" }, "*");
    window.setTimeout(() => finish({ installed: false, authenticated: false }), 700);
  });
}

export async function postTokenToExtension(token: string): Promise<boolean> {
  return await new Promise<boolean>((resolve) => {
    let settled = false;

    function finish(ok: boolean) {
      if (settled) return;
      settled = true;
      window.removeEventListener("message", onMessage);
      resolve(ok);
    }

    function onMessage(event: MessageEvent) {
      if (event.source !== window) return;
      if (event.data?.type === "NOD_AUTH_TOKEN_ACK") {
        finish(true);
      }
    }

    window.addEventListener("message", onMessage);
    window.postMessage({ type: "NOD_AUTH_TOKEN", token }, "*");
    window.setTimeout(() => finish(false), 1500);
  });
}
