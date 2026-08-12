export interface ExtensionConfig {
  env: "development" | "production";
  apiBase: string;
  webBase: string;
  features: {
    verboseLogging: boolean;
    debugPanel: boolean;
    mockData: boolean;
  };
}

let cachedConfig: ExtensionConfig | null = null;

export async function loadConfig(): Promise<ExtensionConfig> {
  if (cachedConfig) {
    return cachedConfig;
  }

  try {
    const response = await fetch(chrome.runtime.getURL("config.json"));
    const config = await response.json();
    cachedConfig = config;
    return config;
  } catch {
    return {
      env: "production",
      apiBase: "https://api.nod-archive.com",
      webBase: "https://nod-archive.com",
      features: {
        verboseLogging: false,
        debugPanel: false,
        mockData: false,
      },
    };
  }
}

export function getConfig(): ExtensionConfig {
  if (!cachedConfig) {
    throw new Error("Config not loaded. Call loadConfig() first.");
  }
  return cachedConfig;
}

export function isDev(): boolean {
  return typeof __DEV__ !== "undefined" && __DEV__;
}
