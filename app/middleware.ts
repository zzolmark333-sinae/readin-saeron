import { NextResponse, type NextRequest } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";

type CookieList = { name: string; value: string; options: CookieOptions }[];

// 승인 게이트: 로그인 → 가입 신청 → 승인 → 사용
export async function middleware(req: NextRequest) {
  let res = NextResponse.next({ request: req });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: CookieList) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) => res.cookies.set(name, value, options));
        },
      },
    }
  );

  const go = (path: string) => {
    const r = NextResponse.redirect(new URL(path, req.url));
    res.cookies.getAll().forEach((c) => r.cookies.set(c));
    return r;
  };

  const path = req.nextUrl.pathname;
  const { data: { user } } = await supabase.auth.getUser();

  if (path.startsWith("/auth")) return res;
  if (!user) return path === "/" ? res : go("/");

  const { data: p } = await supabase
    .from("profiles")
    .select("status, is_admin, signup_completed_at")
    .eq("id", user.id)
    .single();

  if (p?.is_admin) return path === "/" ? go("/admin") : res;
  if (path.startsWith("/admin")) return go("/write");

  if (!p?.signup_completed_at) return path === "/signup" ? res : go("/signup");
  if (p.status !== "approved") return path === "/pending" ? res : go("/pending");
  if (path === "/" || path === "/signup" || path === "/pending") return go("/write");

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/cron).*)"],
};
