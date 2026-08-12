declare global {
  type ChromeRuntimeMessageResponse = {
    success?: boolean;
  };

  type ChromeRuntime = {
    sendMessage?: (
      extensionId: string,
      message: unknown,
      responseCallback?: (response?: ChromeRuntimeMessageResponse) => void
    ) => void;
    lastError?: unknown;
  };

  type Chrome = {
    runtime?: ChromeRuntime;
  };

  var chrome: Chrome | undefined;
}

export {};
