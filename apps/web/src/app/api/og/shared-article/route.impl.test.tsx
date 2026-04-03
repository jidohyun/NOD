import { beforeEach, describe, expect, it, vi } from "vitest";

type ElementNode = {
  props?: {
    children?: unknown;
    style?: Record<string, unknown>;
  };
};

type CapturedImage = {
  element: ElementNode;
  options: {
    width: number;
    height: number;
  };
};

const capturedImages: CapturedImage[] = [];

vi.mock("next/og", () => ({
  ImageResponse: class MockImageResponse {
    headers = new Headers();

    constructor(element: unknown, options: unknown) {
      capturedImages.push({
        element: element as ElementNode,
        options: options as CapturedImage["options"],
      });
    }
  },
}));

import { GET } from "./route.impl";

function isElementNode(value: unknown): value is ElementNode {
  return typeof value === "object" && value !== null && "props" in value;
}

function getChildren(node: ElementNode | null | undefined): ElementNode[] {
  const children = node?.props?.children;
  if (!children) {
    return [];
  }

  return (Array.isArray(children) ? children : [children]).filter(isElementNode);
}

describe("shared article OG image layout", () => {
  beforeEach(() => {
    capturedImages.length = 0;
    vi.restoreAllMocks();
  });

  it("keeps the fallback OG layout unchanged", async () => {
    await GET(new Request("http://localhost/api/og/shared-article"));

    const image = capturedImages.at(-1);
    expect(image?.options).toEqual({ width: 1200, height: 630 });

    const root = image?.element;
    expect(root.props.style.padding).toBe("64px");
    expect(root.props.style.justifyContent).toBe("center");
    expect(root.props.style.background).toBe("linear-gradient(135deg, #334155 0%, #111827 100%)");

    const [brandRow, titleRow] = getChildren(root);
    expect(brandRow.props.style.fontSize).toBe(70);
    expect(titleRow.props.style.marginTop).toBe(18);
    expect(titleRow.props.style.fontSize).toBe(40);
  });

  it("rebalances the shared article layout upward without changing the OG frame size", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          title:
            "i dug through claude code's leaked source and anthropic's codebase is absolutely unhinged",
          summary:
            "클로드의 소스 코드 일부가 유출되어 개발자들이 터미널 내 타마고치, 헥스 인코딩된 문자열, 거대한 파일 등 Anthropic의 개발 관행에 대해 논의했습니다.",
          url: "https://www.reddit.com/r/programming/comments/abc123/example_thread/",
          content_type: "discussion",
        }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );

    await GET(new Request("http://localhost/api/og/shared-article?shareId=test-share-id"));

    const image = capturedImages.at(-1);
    expect(image?.options).toEqual({ width: 1200, height: 630 });

    const root = image?.element;
    expect(root.props.style.boxSizing).toBe("border-box");
    expect(root.props.style.padding).toBe("42px 48px 62px");

    const [badgeRow, contentStack] = getChildren(root);
    const [badgePill] = getChildren(badgeRow);

    expect(badgePill.props.style.alignItems).toBe("center");
    expect(badgePill.props.style.lineHeight).toBe(1.1);
    expect(contentStack.props.style.justifyContent).toBe("center");
    expect(contentStack.props.style.paddingBottom).toBe("18px");

    const [, summaryRow, footerRow] = getChildren(contentStack);
    expect(summaryRow.props.style.marginTop).toBe("18px");
    expect(footerRow.props.style.marginTop).toBe("26px");
    expect(footerRow.props.style.paddingTop).toBe("16px");
  });
});
