import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdminEmail } from "@/lib/supabase/admin";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(new URL("/?error=login", url.origin));

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);
  if (error || !data.user) return NextResponse.redirect(new URL("/?error=login", url.origin));

  // ADMIN_EMAILS에 있는 계정은 자동으로 관리자·승인 처리
  if (isAdminEmail(data.user.email)) {
    await createAdminClient()
      .from("profiles")
      .update({
        is_admin: true,
        status: "approved",
        approved_at: new Date().toISOString(),
        signup_completed_at: new Date().toISOString(),
      })
      .eq("id", data.user.id)
      .is("approved_at", null);
    await createAdminClient()
      .from("profiles").update({ is_admin: true }).eq("id", data.user.id);
    return NextResponse.redirect(new URL("/admin", url.origin));
  }

  return NextResponse.redirect(new URL("/write", url.origin));
}
