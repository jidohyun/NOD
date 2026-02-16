export type ErrorCode =
  | "AUTH_EXPIRED"
  | "NETWORK_ERROR"
  | "EXTRACT_FAILED"
  | "ANALYSIS_FAILED"
  | "USAGE_LIMIT_REACHED"
  | "RATE_LIMITED"
  | "SERVER_ERROR"
  | "UNKNOWN";

export class ExtensionError extends Error {
  constructor(
    public code: ErrorCode,
    message: string,
    public recoverable: boolean = true
  ) {
    super(message);
    this.name = "ExtensionError";
  }

  static fromResponse(response: Response, message?: string): ExtensionError {
    switch (response.status) {
      case 401:
        return new ExtensionError(
          "AUTH_EXPIRED",
          message || "Session expired. Please log in again.",
          true
        );
      case 402:
        return new ExtensionError(
          "USAGE_LIMIT_REACHED",
          message || "Usage limit reached. Upgrade to Pro to continue.",
          true
        );
      case 429:
        return new ExtensionError(
          "RATE_LIMITED",
          message || "Too many requests. Please wait a moment.",
          true
        );
      case 500:
      case 502:
      case 503:
        return new ExtensionError(
          "SERVER_ERROR",
          message || "Server error. Please try again later.",
          true
        );
      default:
        return new ExtensionError(
          "UNKNOWN",
          message || `Request failed: ${response.statusText}`,
          true
        );
    }
  }

  static networkError(): ExtensionError {
    return new ExtensionError(
      "NETWORK_ERROR",
      "No internet connection. Please check your network.",
      true
    );
  }

  static extractFailed(reason?: string): ExtensionError {
    return new ExtensionError(
      "EXTRACT_FAILED",
      reason || "Could not extract content from this page.",
      false
    );
  }
}

export function getErrorMessage(code: ErrorCode): string {
  const messages: Record<ErrorCode, string> = {
    AUTH_EXPIRED: "Please log in again",
    NETWORK_ERROR: "No internet connection",
    EXTRACT_FAILED: "Could not extract content",
    ANALYSIS_FAILED: "Article analysis failed",
    USAGE_LIMIT_REACHED: "Usage limit reached",
    RATE_LIMITED: "Please wait a moment",
    SERVER_ERROR: "Server error occurred",
    UNKNOWN: "Something went wrong",
  };
  return messages[code];
}
