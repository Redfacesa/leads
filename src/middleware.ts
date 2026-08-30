import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

type CookieToSet = { name: string; value: string; options: CookieOptions };

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet: CookieToSet[]) {
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: { user } } = await supabase.auth.getUser();
  const path = request.nextUrl.pathname;

  if ((path.startsWith("/dashboard") || path.startsWith("/admin")) && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path.startsWith("/admin") ? path.replace(/^\/admin/, "/dashboard") : path);
    return NextResponse.redirect(login);
  }

  if ((path.startsWith("/client") || path.startsWith("/partner")) && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path.replace(/^\/partner/, "/client"));
    return NextResponse.redirect(login);
  }

  if (path.startsWith("/partners-network") && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  return response;
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/admin/:path*",
    "/client/:path*",
    "/partner/:path*",
    "/partners-network/:path*",
  ],
};
