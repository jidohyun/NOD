import { describe, expect, test } from "bun:test";
import { HttpError, normalizeUrl } from "./worker.js";

describe("normalizeUrl", () => {
  test("accepts http and https URLs and returns the hostname", () => {
    expect(normalizeUrl("https://example.com/path?q=1")).toEqual({
      url: "https://example.com/path?q=1",
      hostname: "example.com",
    });
    expect(normalizeUrl("http://example.com")).toEqual({
      url: "http://example.com/",
      hostname: "example.com",
    });
  });

  test("strips the fragment", () => {
    expect(normalizeUrl("https://example.com/a#section").url).toBe("https://example.com/a");
  });

  test("rejects non-http(s) schemes", () => {
    for (const value of ["ftp://example.com", "javascript:alert(1)", "file:///etc/passwd", "chrome-extension://abc"]) {
      expect(() => normalizeUrl(value)).toThrow(HttpError);
    }
  });

  test("rejects URLs with credentials", () => {
    expect(() => normalizeUrl("https://user:pass@example.com")).toThrow(HttpError);
  });

  test("rejects malformed and empty input", () => {
    for (const value of ["", "not a url", null, undefined, 42]) {
      expect(() => normalizeUrl(value)).toThrow(HttpError);
    }
  });

  test("rejects URLs over the length limit", () => {
    expect(() => normalizeUrl(`https://example.com/${"a".repeat(4096)}`)).toThrow(HttpError);
  });

  test("thrown errors carry the invalid_url code", () => {
    try {
      normalizeUrl("javascript:alert(1)");
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(HttpError);
      expect(error.status).toBe(400);
      expect(error.code).toBe("invalid_url");
    }
  });
});
