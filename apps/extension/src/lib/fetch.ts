import { ExtensionError } from "./errors";

export async function parseErrorMessage(response: Response): Promise<string | undefined> {
  try {
    const payload = (await response.clone().json()) as { detail?: string };
    if (typeof payload?.detail === "string" && payload.detail.trim().length > 0) {
      return payload.detail;
    }
  } catch {
    return undefined;
  }

  return undefined;
}

export function isLikelyFetchNetworkError(error: unknown): boolean {
  return error instanceof TypeError && error.message.includes("fetch");
}

export function toUnknownRequestError(error: unknown): ExtensionError {
  return new ExtensionError(
    "UNKNOWN",
    error instanceof Error ? error.message : "Request failed",
    true
  );
}
