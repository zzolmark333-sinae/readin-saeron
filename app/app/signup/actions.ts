"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type SignupState = { error?: string };

export async function submitSignup(_: SignupState, form: FormData): Promise<SignupState> {
  const get = (k: string) => String(form.get(k) ?? "").trim();
  const data = {
    name: get("name"),
    academy_name: get("academy_name"),
    region: get("region"),
    phone: get("phone"),
    signup_note: get("signup_note") || null,
  };
  if (!data.name || !data.academy_name || !data.region || !data.phone)
    return { error: "이름, 학원명, 지역, 연락처를 모두 적어 주세요." };

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/");

  const { error } = await supabase
    .from("profiles")
    .update({ ...data, signup_completed_at: new Date().toISOString() })
    .eq("id", user.id);
  if (error) return { error: "저장하지 못했어요. 잠시 후 다시 시도해 주세요." };

  redirect("/pending");
}
