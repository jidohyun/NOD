import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    OTEL_SERVICE_NAME: z.string().optional().default("web"),
    OTEL_SAMPLE_RATE: z
      .string()
      .optional()
      .default("0.1")
      .transform((val) => Number.parseFloat(val)),
  },

  client: {
    NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
    NEXT_PUBLIC_API_URL: z.string().url().optional().default("http://localhost:8000"),
    NEXT_PUBLIC_SITE_URL: z.string().url().optional().default("https://example.com"),
    NEXT_PUBLIC_GA_ID: z.string().optional(),
    NEXT_PUBLIC_ENABLE_DEVTOOLS: z.enum(["true", "false"]).optional().default("false"),
    NEXT_PUBLIC_GIT_COMMIT: z.string().optional(),
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: z.string().optional(),
    NEXT_PUBLIC_PADDLE_ENVIRONMENT: z.enum(["sandbox", "production"]).optional().default("sandbox"),
  },

  runtimeEnv: {
    OTEL_SERVICE_NAME: process.env.OTEL_SERVICE_NAME,
    OTEL_SAMPLE_RATE: process.env.OTEL_SAMPLE_RATE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_ENABLE_DEVTOOLS: process.env.NEXT_PUBLIC_ENABLE_DEVTOOLS,
    NEXT_PUBLIC_GIT_COMMIT: process.env.NEXT_PUBLIC_GIT_COMMIT,
    NEXT_PUBLIC_PADDLE_CLIENT_TOKEN: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN,
    NEXT_PUBLIC_PADDLE_ENVIRONMENT: process.env.NEXT_PUBLIC_PADDLE_ENVIRONMENT,
  },

  skipValidation: !!process.env.SKIP_ENV_VALIDATION,
});
