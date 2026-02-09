import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { type NextRequest, NextResponse } from "next/server";

type CookiesToSet = Parameters<
  NonNullable<Parameters<typeof createServerClient>[2]["cookies"]["setAll"]>
>[0];

function firstForwardedValue(value: string | null): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

function getOrigin(request: NextRequest): string {
  const configuredSiteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const configuredOrigin = (() => {
    if (!configuredSiteUrl) return null;
    try {
      return new URL(configuredSiteUrl).origin;
    } catch {
      return null;
    }
  })();

  const proto = firstForwardedValue(request.headers.get("x-forwarded-proto")) ?? "https";
  const host =
    firstForwardedValue(request.headers.get("x-forwarded-host")) ??
    request.headers.get("host");

  if (host) {
    if (
      configuredOrigin &&
      (host === "0.0.0.0" ||
        host.startsWith("0.0.0.0:") ||
        host === "127.0.0.1" ||
        host.startsWith("127.0.0.1:") ||
        host === "localhost" ||
        host.startsWith("localhost:"))
    ) {
      return configuredOrigin;
    }
    return `${proto}://${host}`;
  }

  return configuredOrigin ?? new URL(request.url).origin;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const origin = getOrigin(request);
  const code = searchParams.get("code");
  const nextParam = searchParams.get("next");
  const next =
    typeof nextParam === "string" && nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/articles";

  if (code) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet: CookiesToSet) {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          },
        },
      }
    );

    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}
