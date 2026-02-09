import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "@/lib/i18n/routing";

type CookiesToSet = Parameters<
  NonNullable<Parameters<typeof createServerClient>[2]["cookies"]["setAll"]>
>[0];

const intlMiddleware = createMiddleware(routing);

const locales = ["ko", "en", "ja"];
const defaultLocale = "ko";

function getPathWithoutLocale(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return pathname.slice(`/${locale}`.length) || "/";
    }
  }
  return pathname;
}

function getLocaleFromPath(pathname: string): string {
  for (const locale of locales) {
    if (pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`) {
      return locale;
    }
  }
  return defaultLocale;
}

const protectedPaths = ["/articles", "/dashboard", "/settings", "/extension-auth", "/onboarding"];
const authPaths = ["/login"];

export async function proxy(request: NextRequest) {
  const { nextUrl } = request;
  const pathname = nextUrl.pathname;
  const pathWithoutLocale = getPathWithoutLocale(pathname);
  const locale = getLocaleFromPath(pathname);

  // Create Supabase client for middleware
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: CookiesToSet) {
          for (const { name, value } of cookiesToSet) {
            request.cookies.set(name, value);
          }
          supabaseResponse = NextResponse.next({ request });
          for (const { name, value, options } of cookiesToSet) {
            supabaseResponse.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();
  const isAuthenticated = Boolean(user);

  const isProtectedRoute = protectedPaths.some(
    (path) => pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`)
  );

  const isAuthRoute = authPaths.some(
    (path) => pathWithoutLocale === path || pathWithoutLocale.startsWith(`${path}/`)
  );

  if (isProtectedRoute && !isAuthenticated) {
    const loginUrl = new URL(locale === defaultLocale ? "/login" : `/${locale}/login`, request.url);
    return NextResponse.redirect(loginUrl);
  }

  if (isAuthRoute && isAuthenticated) {
    const redirectParam = nextUrl.searchParams.get("redirect");
    const isSafeRedirect =
      typeof redirectParam === "string" &&
      redirectParam.startsWith("/") &&
      !redirectParam.startsWith("//");

    const target = isSafeRedirect ? redirectParam : "/dashboard";
    const hasLocalePrefix = locales.some((l) => target === `/${l}` || target.startsWith(`/${l}/`));
    const targetWithLocale =
      hasLocalePrefix || locale === defaultLocale ? target : `/${locale}${target}`;

    return NextResponse.redirect(new URL(targetWithLocale, request.url));
  }

  const response = intlMiddleware(request);

  // Copy Supabase cookies to the intl response
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    response.cookies.set(cookie.name, cookie.value);
  });

  response.headers.set("x-pathname", pathname);

  return response;
}

export const config = {
  matcher: ["/((?!api|_proxy|_next|_vercel|.*\\..*).*)"],
};
