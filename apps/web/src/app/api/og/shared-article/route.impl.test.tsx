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

  it("keeps padded content inside the frame and centers the main content stack", async () => {
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
    expect(root.props.style.padding).toBe("48px 48px 44px");

    const [badgeRow, contentStack] = getChildren(root);
    const [badgePill] = getChildren(badgeRow);

    expect(badgePill.props.style.alignItems).toBe("center");
    expect(badgePill.props.style.lineHeight).toBe(1.1);
    expect(contentStack.props.style.justifyContent).toBe("center");

    const [, , footerRow] = getChildren(contentStack);
    expect(footerRow.props.style.marginTop).toBe("30px");
    expect(footerRow.props.style.paddingTop).toBe("18px");
  });
});
