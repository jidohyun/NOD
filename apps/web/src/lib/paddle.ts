"use client";

import { initializePaddle, type Paddle } from "@paddle/paddle-js";

let paddleInstance: Paddle | null = null;
let paddlePromise: Promise<Paddle | undefined> | null = null;
let initializedToken: string | null = null;

function getOrInitPaddle(
  token: string,
  environment: "sandbox" | "production"
): Promise<Paddle | undefined> {
  if (paddleInstance && initializedToken === token) {
    return Promise.resolve(paddleInstance);
  }

  // Reset if token changed (e.g. sandbox -> production switch)
  if (initializedToken && initializedToken !== token) {
    paddleInstance = null;
    paddlePromise = null;
  }

  if (!paddlePromise) {
    initializedToken = token;
    paddlePromise = initializePaddle({ token, environment }).then((paddle) => {
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
  clientToken: string;
  environment: "sandbox" | "production";
}

export async function openCheckout({
  priceId,
  userId,
  userEmail,
  locale,
  clientToken,
  environment,
}: OpenCheckoutParams): Promise<void> {
  const paddle = await getOrInitPaddle(clientToken, environment);
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
