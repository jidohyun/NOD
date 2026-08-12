import { fireEvent, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { renderWithProviders } from "../../../test/utils";
import { BillingContent } from "../billing-content";

const mockUseSubscription = vi.fn();
const mockUseUsage = vi.fn();
const mockUsePortalUrl = vi.fn();
const mockUseCheckout = vi.fn();
const mockUseRedeemPromoCode = vi.fn();
const mockUseCurrentPromoEntitlement = vi.fn();
const mockInvalidate = vi.fn();

const RE_PROMO_CODE = /promo code/i;
const RE_APPLY_PROMO = /apply promo/i;
const RE_PROMO_APPLIED = /promo applied/i;
const RE_INVALID_PROMO_CODE = /invalid promo code/i;
const RE_HAS_EXPIRED = /has expired/i;
const RE_PRO_ACTIVE_VIA_PROMO = /pro active via promo/i;

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

vi.mock("next-intl", async () => {
  const translations: Record<string, string> = {
    "promo.title": "Promo Code",
    "promo.placeholder": "Enter promo code",
    "promo.apply": "Apply Promo",
    "promo.success": "Promo applied",
    "promo.errorInvalid": "Invalid promo code",
    "promo.errorExpired": "This promo code has expired",
    "promo.errorLimit": "Promo redemption limit reached",
    "promo.errorGeneric": "Unable to apply promo code",
    "promo.effectivePro": "Pro active via promo",
    processing: "Processing...",
    backToSettings: "Back to settings",
    manageBilling: "Manage Billing",
    billingSubtitle: "Manage billing",
    unlimited: "Unlimited",
    summariesUsed: "",
    basic: "Free",
    pro: "Pro",
    basicPrice: "$0",
    proPrice: "$5/mo",
    "features.proSummaries": "",
    "features.proArticles": "pro-articles",
    "features.proSearch": "pro-search",
    "features.basicSummaries": "basic-summaries",
    "features.basicArticles": "basic-articles",
    "features.basicSearch": "basic-search",
    currentPlan: "Current Plan",
    nextBilling: "Next billing",
    usage: "Usage",
    currentMonthlyAiSummaries: "Current monthly AI summaries",
    limitReached: "Limit reached",
    includedInPlan: "Included",
    billingControls: "Billing Controls",
    managePayment: "Manage payment",
    cancelDescription: "cancel desc",
    cancel: "Cancel",
    proUpgradeDescription: "Upgrade to pro",
    upgrade: "Upgrade",
    billingStatus: "Billing Status",
    planStatus: "Plan status",
    nextBillingLabel: "Next billing",
    cancelConfirm: "confirm",
    checkoutSuccess: "Checkout success",
    upgradeUnavailable: "Unavailable",
    "promo.activeUntil": "Promo active until: {date}",
  };

  const t = (key: string, values?: Record<string, string | number>) => {
    if (key === "summariesUsed" && values) {
      return `${values.used}/${values.limit}`;
    }
    if (key === "promo.activeUntil" && values) {
      return `Promo active until: ${values.date}`;
    }
    return translations[key] ?? key;
  };

  const actual = await vi.importActual("next-intl");
  return {
    ...actual,
    useLocale: () => "en",
    useTranslations: () => t,
  };
});

vi.mock("@/lib/i18n/routing", () => ({
  Link: ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));

vi.mock("@/lib/paddle", () => ({
  openCheckout: vi.fn(),
}));

vi.mock("@/lib/api/subscriptions", () => ({
  useSubscription: () => mockUseSubscription(),
  useUsage: () => mockUseUsage(),
  usePortalUrl: () => mockUsePortalUrl(),
  useCheckout: () => mockUseCheckout(),
  useRedeemPromoCode: () => mockUseRedeemPromoCode(),
  useCurrentPromoEntitlement: () => mockUseCurrentPromoEntitlement(),
  useInvalidateSubscription: () => mockInvalidate,
}));

describe("BillingContent promo code", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    mockUseSubscription.mockReturnValue({
      data: {
        id: "sub-1",
        user_id: "user-1",
        plan: "basic",
        status: "active",
        paddle_subscription_id: null,
        current_period_start: null,
        current_period_end: null,
        cancel_at: null,
        created_at: "2026-03-24T00:00:00Z",
        updated_at: null,
      },
      isLoading: false,
    });

    mockUseUsage.mockReturnValue({
      data: {
        plan: "basic",
        status: "active",
        summaries_used: 1,
        summaries_limit: 20,
        can_summarize: true,
      },
      isLoading: false,
    });

    mockUsePortalUrl.mockReturnValue({ refetch: vi.fn() });
    mockUseCheckout.mockReturnValue({ mutateAsync: vi.fn() });
    mockUseCurrentPromoEntitlement.mockReturnValue({
      data: { has_active_promo: false },
      isLoading: false,
    });
    mockUseRedeemPromoCode.mockReturnValue({
      mutateAsync: vi.fn().mockResolvedValue({
        message: "Promo applied",
      }),
      isPending: false,
    });
  });

  it("shows promo section and applies promo code", async () => {
    renderWithProviders(<BillingContent />);

    const input = screen.getByPlaceholderText(RE_PROMO_CODE);
    const applyButton = screen.getByRole("button", { name: RE_APPLY_PROMO });

    fireEvent.change(input, { target: { value: "SPRING2026" } });
    fireEvent.click(applyButton);

    await waitFor(() => {
      expect(mockInvalidate).toHaveBeenCalledTimes(1);
      expect(screen.getByText(RE_PROMO_APPLIED)).toBeTruthy();
    });
  });

  it("shows redeem error message when promo apply fails", async () => {
    mockUseRedeemPromoCode.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue(new Error("invalid_code")),
      isPending: false,
    });

    renderWithProviders(<BillingContent />);

    fireEvent.change(screen.getByPlaceholderText(RE_PROMO_CODE), {
      target: { value: "BADCODE" },
    });
    fireEvent.click(screen.getByRole("button", { name: RE_APPLY_PROMO }));

    await waitFor(() => {
      expect(screen.getByText(RE_INVALID_PROMO_CODE)).toBeTruthy();
    });
  });

  it("maps expired promo error response", async () => {
    mockUseRedeemPromoCode.mockReturnValue({
      mutateAsync: vi.fn().mockRejectedValue({ response: { status: 410 } }),
      isPending: false,
    });

    renderWithProviders(<BillingContent />);

    fireEvent.change(screen.getByPlaceholderText(RE_PROMO_CODE), {
      target: { value: "EXPIRED" },
    });
    fireEvent.click(screen.getByRole("button", { name: RE_APPLY_PROMO }));

    await waitFor(() => {
      expect(screen.getByText(RE_HAS_EXPIRED)).toBeTruthy();
    });
  });

  it("shows promo effective pro badge when usage is pro via promo", async () => {
    mockUseCurrentPromoEntitlement.mockReturnValue({
      data: {
        has_active_promo: true,
        ends_at: "2026-04-24T12:00:00Z",
      },
      isLoading: false,
    });
    mockUseUsage.mockReturnValue({
      data: {
        plan: "pro",
        status: "active",
        summaries_used: 1,
        summaries_limit: -1,
        can_summarize: true,
      },
      isLoading: false,
    });

    renderWithProviders(<BillingContent />);

    expect(screen.getByText(RE_PRO_ACTIVE_VIA_PROMO)).toBeTruthy();
  });
});
