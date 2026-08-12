import { describe, expect, it } from "vitest";
import { resolveWebClipperSlugForLocale } from "../web-clipper-slug-routing";

describe("resolveWebClipperSlugForLocale", () => {
  it("maps web-clipper-guide to chrome-web-clipper for non-ko locales", () => {
    expect(resolveWebClipperSlugForLocale("en", "web-clipper-guide")).toBe("chrome-web-clipper");
    expect(resolveWebClipperSlugForLocale("ja", "web-clipper-guide")).toBe("chrome-web-clipper");
  });

  it("maps chrome-web-clipper to web-clipper-guide for ko locale", () => {
    expect(resolveWebClipperSlugForLocale("ko", "chrome-web-clipper")).toBe("web-clipper-guide");
  });

  it("keeps locale-canonical slugs unchanged", () => {
    expect(resolveWebClipperSlugForLocale("ko", "web-clipper-guide")).toBe("web-clipper-guide");
    expect(resolveWebClipperSlugForLocale("en", "chrome-web-clipper")).toBe("chrome-web-clipper");
  });
});
