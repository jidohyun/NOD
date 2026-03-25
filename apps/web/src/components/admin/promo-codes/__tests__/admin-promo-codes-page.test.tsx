import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminPromoCodesPage } from "../admin-promo-codes-page";

const mockUseAdminListPromoCodes = vi.fn();
const mockUseAdminCreatePromoCode = vi.fn();
const mockUseAdminDisablePromoCode = vi.fn();

vi.mock("next-intl", async () => {
  const actual = await vi.importActual("next-intl");
  const messages: Record<string, string> = {
    "adminPromo.title": "Promo Code Issuer",
    "adminPromo.description": "Issue, review, and disable promo codes for internal campaigns.",
    "adminPromo.issue.title": "Issue a new promo code",
    "adminPromo.fields.code": "Code",
    "adminPromo.fields.grantDays": "Grant days",
    "adminPromo.fields.expiresAt": "Expires at",
    "adminPromo.fields.maxRedemptions": "Max redemptions",
    "adminPromo.fields.perUserLimit": "Per-user limit",
    "adminPromo.fields.campaignTag": "Campaign tag",
    "adminPromo.actions.issuing": "Issuing...",
    "adminPromo.actions.issue": "Issue code",
    "adminPromo.actions.copyLatest": "Copy latest code",
    "adminPromo.actions.disable": "Disable",
    "adminPromo.actions.cancel": "Cancel",
    "adminPromo.actions.disabling": "Disabling...",
    "adminPromo.actions.confirmDisable": "Confirm disable",
    "adminPromo.list.title": "Issued promo codes",
    "adminPromo.list.empty": "No promo codes found for current filters.",
    "adminPromo.filters.campaignPlaceholder": "Filter by campaign tag",
    "adminPromo.filters.statusAll": "All statuses",
    "adminPromo.filters.statusActive": "Active only",
    "adminPromo.filters.statusInactive": "Inactive only",
    "adminPromo.filters.apply": "Apply filters",
    "adminPromo.table.campaign": "Campaign",
    "adminPromo.table.status": "Status",
    "adminPromo.table.grantDays": "Grant days",
    "adminPromo.table.redeemed": "Redeemed",
    "adminPromo.table.created": "Created",
    "adminPromo.table.actions": "Actions",
    "adminPromo.table.none": "(none)",
    "adminPromo.table.active": "Active",
    "adminPromo.table.inactive": "Inactive",
    "adminPromo.disable.title": "Disable promo code",
    "adminPromo.disable.description": "This code will no longer be redeemable.",
    "adminPromo.disable.reason": "Disable reason",
    "adminPromo.disable.reasonNote":
      "Reason is for operator context only and is not sent to API in this MVP.",
    "adminPromo.success.created": "Promo code issued successfully.",
    "adminPromo.success.disabled": "Promo code disabled successfully.",
    "adminPromo.success.copied": "Latest issued code copied.",
    "adminPromo.errors.duplicate": "Promo code already exists.",
    "adminPromo.errors.notFound": "Promo code not found.",
    "adminPromo.errors.generic": "Unable to complete this action right now.",
    "adminPromo.errors.loadFailed": "Failed to load promo codes.",
    "adminPromo.latestCode": "Latest issued code: {code}",
  };

  return {
    ...actual,
    useTranslations: () => (key: string, values?: { code?: string }) => {
      if (key === "adminPromo.latestCode" && values?.code) {
        return `Latest issued code: ${values.code}`;
      }
      return messages[key] ?? key;
    },
  };
});

vi.mock("@/lib/api/subscriptions", () => ({
  useAdminListPromoCodes: (params: unknown) => mockUseAdminListPromoCodes(params),
  useAdminCreatePromoCode: () => mockUseAdminCreatePromoCode(),
  useAdminDisablePromoCode: () => mockUseAdminDisablePromoCode(),
}));

describe("AdminPromoCodesPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseAdminListPromoCodes.mockReturnValue({
      data: {
        items: [
          {
            id: "promo-1",
            campaign_tag: "spring",
            grant_plan: "pro",
            grant_days: 30,
            max_redemptions: 100,
            redeemed_count: 5,
            per_user_limit: 1,
            expires_at: null,
            is_active: true,
            created_at: "2026-03-25T00:00:00Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch: vi.fn().mockResolvedValue(undefined),
    });

    mockUseAdminCreatePromoCode.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    });

    mockUseAdminDisablePromoCode.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({}),
      isPending: false,
    });
  });

  it("renders issue form and existing promo code rows", () => {
    render(<AdminPromoCodesPage />);

    expect(screen.getByText(/promo code issuer/i)).toBeTruthy();
    expect(screen.getByText(/issue a new promo code/i)).toBeTruthy();
    expect(screen.getByText("spring")).toBeTruthy();
    expect(screen.getByRole("button", { name: /disable/i })).toBeTruthy();
  });

  it("maps create 409 error to duplicate message", async () => {
    const mutateAsync = vi.fn().mockRejectedValue({
      response: { status: 409, data: { detail: "promo_code_already_exists" } },
    });
    mockUseAdminCreatePromoCode.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<AdminPromoCodesPage />);

    fireEvent.change(screen.getByLabelText("Code"), {
      target: { value: "SPRING2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: /issue code/i }));

    await waitFor(() => {
      expect(screen.getByText(/promo code already exists/i)).toBeTruthy();
    });
  });

  it("maps disable 404 error to not-found message", async () => {
    const mutateAsync = vi.fn().mockRejectedValue({
      response: { status: 404, data: { detail: "promo_code_not_found" } },
    });
    mockUseAdminDisablePromoCode.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<AdminPromoCodesPage />);

    fireEvent.click(screen.getByRole("button", { name: /disable/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm disable/i }));

    await waitFor(() => {
      expect(screen.getByText(/promo code not found/i)).toBeTruthy();
    });
  });

  it("refreshes list after successful create and disable", async () => {
    const refetch = vi.fn().mockResolvedValue(undefined);
    mockUseAdminListPromoCodes.mockReturnValue({
      data: {
        items: [
          {
            id: "promo-1",
            campaign_tag: "spring",
            grant_plan: "pro",
            grant_days: 30,
            max_redemptions: 100,
            redeemed_count: 5,
            per_user_limit: 1,
            expires_at: null,
            is_active: true,
            created_at: "2026-03-25T00:00:00Z",
          },
        ],
      },
      isLoading: false,
      isError: false,
      refetch,
    });

    const createMutate = vi.fn().mockResolvedValue({});
    const disableMutate = vi.fn().mockResolvedValue({});
    mockUseAdminCreatePromoCode.mockReturnValue({
      mutateAsync: createMutate,
      isPending: false,
    });
    mockUseAdminDisablePromoCode.mockReturnValue({
      mutateAsync: disableMutate,
      isPending: false,
    });

    render(<AdminPromoCodesPage />);

    fireEvent.change(screen.getByLabelText("Code"), {
      target: { value: "FALL2026" },
    });
    fireEvent.click(screen.getByRole("button", { name: /issue code/i }));

    await waitFor(() => {
      expect(createMutate).toHaveBeenCalledTimes(1);
      expect(refetch).toHaveBeenCalledTimes(1);
    });

    fireEvent.click(screen.getByRole("button", { name: /disable/i }));
    fireEvent.click(screen.getByRole("button", { name: /confirm disable/i }));

    await waitFor(() => {
      expect(disableMutate).toHaveBeenCalledTimes(1);
      expect(refetch).toHaveBeenCalledTimes(2);
    });
  });
});
