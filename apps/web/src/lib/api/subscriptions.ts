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

export function useInvalidateSubscription() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: ["subscription"] });
  };
}
