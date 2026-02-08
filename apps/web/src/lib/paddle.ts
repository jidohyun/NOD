"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";
import { env } from "@/config/env";

let paddleInstance: Paddle | null = null;
let paddlePromise: Promise<Paddle | undefined> | null = null;

export function getPaddle(): Promise<Paddle | undefined> {
  if (paddleInstance) return Promise.resolve(paddleInstance);

  const token = env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN;
  if (!token) return Promise.resolve(undefined);

  if (!paddlePromise) {
    paddlePromise = initializePaddle({
      token,
      environment: env.NEXT_PUBLIC_PADDLE_ENVIRONMENT as "sandbox" | "production",
    }).then((paddle) => {
      paddleInstance = paddle ?? null;
      return paddle;
    });
  }

  return paddlePromise;
}

export interface OpenCheckoutParams {
  priceId: string;
  userId: string;
  userEmail?: string | null;
  locale?: string;
}

export async function openCheckout({
  priceId,
  userId,
  userEmail,
  locale,
}: OpenCheckoutParams): Promise<void> {
  const paddle = await getPaddle();
  if (!paddle) {
    throw new Error("Paddle not initialized");
  }

  paddle.Checkout.open({
    items: [{ priceId, quantity: 1 }],
    customData: { user_id: userId },
    customer: userEmail ? { email: userEmail } : undefined,
    settings: {
      locale,
      successUrl: `${window.location.origin}/settings/billing?checkout=success`,
    },
  });
}
