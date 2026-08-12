import { describe, expect, it } from "vitest";
import { formatOgDescription, formatOgHeadline } from "./og-text-utils";

describe("formatOgHeadline", () => {
  it("collapses line breaks and repeated spaces", () => {
    expect(formatOgHeadline("  Ask GN:\n혹시   Description 추가 가능할까요?  ")).toBe(
      "Ask GN: 혹시 Description 추가 가능할까요?"
    );
  });

  it("truncates with ellipsis when exceeding max length", () => {
    const value = "a".repeat(100);
    expect(formatOgHeadline(value, 10)).toBe("aaaaaaaaa…");
  });
});

describe("formatOgDescription", () => {
  it("collapses whitespace and keeps readable sentence", () => {
    expect(formatOgDescription("안녕하세요!\n\n항상   올라오는 최신글 잘 보고있습니다.")).toBe(
      "안녕하세요! 항상 올라오는 최신글 잘 보고있습니다."
    );
  });

  it("truncates long summary with ellipsis", () => {
    const value = "요약".repeat(200);
    const formatted = formatOgDescription(value, 12);
    expect(formatted.endsWith("…")).toBe(true);
    expect(formatted.length).toBe(12);
  });
});
