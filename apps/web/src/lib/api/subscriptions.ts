import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

export interface UsageInfo {
  plan: string;
  status: string;
  summaries_used: number;
  summaries_limit: number;
  can_summarize: boolean;
}

export interface SubscriptionInfo {
  id: string;
  user_id: string;
  plan: string;
  status: string;
  paddle_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at: string | null;
  created_at: string;
  updated_at: string | null;
}

export interface CheckoutInfo {
  client_token: string;
  price_id: string;
  environment: string;
  user_id: string;
  user_email: string | null;
}

export interface PortalUrlInfo {
  cancel_url: string | null;
  update_payment_method_url: string | null;
}

export interface PromoCurrentInfo {
  has_active_promo: boolean;
  plan?: string | null;
  starts_at?: string | null;
  ends_at?: string | null;
  campaign_tag?: string | null;
}

export interface PromoRedeemPayload {
  code: string;
}

export interface PromoRedeemInfo {
  plan: string;
  starts_at: string;
  ends_at: string;
  campaign_tag: string | null;
  message: string;
}

export interface AdminPromoCodeInfo {
  id: string;
  campaign_tag: string | null;
  grant_plan: string;
  grant_days: number;
  max_redemptions: number | null;
  redeemed_count: number;
  per_user_limit: number;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AdminPromoCodeListInfo {
  items: AdminPromoCodeInfo[];
}

export interface AdminPromoCodeCreatePayload {
  code: string;
  grant_days: number;
  expires_at?: string | null;
  max_redemptions?: number | null;
  per_user_limit?: number;
  campaign_tag?: string | null;
}

export interface AdminPromoCodeListParams {
  campaign_tag?: string;
  is_active?: boolean;
}

export function useUsage() {
  return useQuery({
    queryKey: ["subscription", "usage"],
    queryFn: async () => {
      const { data } = await apiClient.get<UsageInfo>("/api/subscriptions/usage");
      return data;
    },
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ["subscription", "current"],
    queryFn: async () => {
      const { data } = await apiClient.get<SubscriptionInfo>("/api/subscriptions/current");
      return data;
    },
  });
}

export function useCheckout() {
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post<CheckoutInfo>("/api/subscriptions/checkout");
      return data;
    },
  });
}

export function usePortalUrl() {
  return useQuery({
    queryKey: ["subscription", "portal-url"],
    queryFn: async () => {
      const { data } = await apiClient.get<PortalUrlInfo>("/api/subscriptions/portal-url");
      return data;
    },
    enabled: false,
  });
}

export function useCurrentPromoEntitlement() {
  return useQuery({
    queryKey: ["subscription", "promo", "current"],
    queryFn: async () => {
      const { data } = await apiClient.get<PromoCurrentInfo>("/api/subscriptions/promo/current");
      return data;
    },
  });
}

export function useRedeemPromoCode() {
  return useMutation({
    mutationFn: async (payload: PromoRedeemPayload) => {
      const { data } = await apiClient.post<PromoRedeemInfo>(
        "/api/subscriptions/promo/redeem",
        payload
      );
      return data;
    },
  });
}

export function useAdminCreatePromoCode() {
  return useMutation({
    mutationFn: async (payload: AdminPromoCodeCreatePayload) => {
      const { data } = await apiClient.post<AdminPromoCodeInfo>(
        "/api/subscriptions/promo/admin/codes",
        payload
      );
      return data;
    },
  });
}

export function useAdminListPromoCodes(params?: AdminPromoCodeListParams) {
  return useQuery({
    queryKey: ["subscription", "promo", "admin", "codes", params],
    queryFn: async () => {
      const { data } = await apiClient.get<AdminPromoCodeListInfo>(
        "/api/subscriptions/promo/admin/codes",
        { params }
      );
      return data;
    },
  });
}

export function useAdminDisablePromoCode() {
  return useMutation({
    mutationFn: async (promoCodeId: string) => {
      const { data } = await apiClient.post<AdminPromoCodeInfo>(
        `/api/subscriptions/promo/admin/codes/${promoCodeId}/disable`
      );
      return data;
    },
  });
}

export function useInvalidateSubscription() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
  };
}
