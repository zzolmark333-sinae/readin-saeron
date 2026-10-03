import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Profile = {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  academy_name: string | null;
  region: string | null;
  signup_note: string | null;
  signup_completed_at: string | null;
  status: "pending" | "approved" | "rejected" | "suspended";
  is_admin: boolean;
  created_at: string;
  approved_at: string | null;
};

export async function getMe() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null };
  const { data: profile } = await supabase
    .from("profiles").select("*").eq("id", user.id).single<Profile>();
  return { user, profile };
}

export async function requireAdmin() {
  const { user, profile } = await getMe();
  if (!user || !profile?.is_admin) redirect("/");
  return { user, profile };
}
