import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getToken: vi.fn(),
  sendMessage: vi.fn(),
  fetch: vi.fn(),
}));

vi.mock("./auth", () => ({
  getToken: mocks.getToken,
}));

import { getUsageInfo } from "./api";

vi.stubGlobal("navigator", { onLine: true, userAgent: "Vitest" });
vi.stubGlobal("fetch", mocks.fetch);
vi.stubGlobal("chrome", {
  runtime: {
    sendMessage: mocks.sendMessage,
  },
});

describe("api request auth refresh", () => {
  beforeEach(() => {
    mocks.fetch.mockReset();
    mocks.sendMessage.mockReset();
    mocks.getToken.mockReset();
  });

  it("retries once after successful token refresh", async () => {
    mocks.getToken
      .mockResolvedValueOnce("expired-token")
      .mockResolvedValueOnce("fresh-token");

    mocks.fetch
      .mockResolvedValueOnce(new Response(JSON.stringify({ detail: "expired" }), { status: 401 }))
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({
            plan: "free",
            status: "active",
            summaries_used: 1,
            summaries_limit: 10,
            can_summarize: true,
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" },
          }
        )
      );

    mocks.sendMessage.mockImplementation(
      (_message: unknown, cb: (response: { success: boolean }) => void) => {
        cb({ success: true });
      }
    );

    const result = await getUsageInfo();

    expect(result.plan).toBe("free");
    expect(mocks.fetch).toHaveBeenCalledTimes(2);
    expect(mocks.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("throws auth expired when refresh fails", async () => {
    mocks.getToken.mockResolvedValue("expired-token");
    mocks.fetch.mockResolvedValueOnce(
      new Response(JSON.stringify({ detail: "expired" }), { status: 401 })
    );
    mocks.sendMessage.mockImplementation(
      (_message: unknown, cb: (response: { success: boolean }) => void) => {
        cb({ success: false });
      }
    );

    await expect(getUsageInfo()).rejects.toMatchObject({ code: "AUTH_EXPIRED" });
  });
});
