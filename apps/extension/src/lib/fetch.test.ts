import { describe, expect, it } from "vitest";

import { ExtensionError } from "./errors";
import {
  isLikelyFetchNetworkError,
  parseErrorMessage,
  toUnknownRequestError,
} from "./fetch";

describe("fetch helpers", () => {
  it("parses detail from JSON error responses", async () => {
    const response = new Response(JSON.stringify({ detail: "boom" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });

    await expect(parseErrorMessage(response)).resolves.toBe("boom");
  });

  it("returns undefined for non-json responses", async () => {
    const response = new Response("not-json", { status: 500 });

    await expect(parseErrorMessage(response)).resolves.toBeUndefined();
  });

  it("detects fetch network errors", () => {
    expect(isLikelyFetchNetworkError(new TypeError("Failed to fetch"))).toBe(true);
    expect(isLikelyFetchNetworkError(new Error("other"))).toBe(false);
  });

  it("wraps unknown request errors consistently", () => {
    const error = toUnknownRequestError(new Error("kaput"));

    expect(error).toBeInstanceOf(ExtensionError);
    expect(error.code).toBe("UNKNOWN");
    expect(error.message).toBe("kaput");
  });
});
