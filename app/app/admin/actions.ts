"use server";
import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";

const ALLOWED = ["approved", "rejected", "suspended", "pending"] as const;
type Status = (typeof ALLOWED)[number];

export async function setStatus(form: FormData) {
  const { user } = await requireAdmin();
  const id = String(form.get("id"));
  const status = String(form.get("status")) as Status;
  if (!ALLOWED.includes(status) || id === user.id) return;

  await createAdminClient()
    .from("profiles")
    .update({ status, approved_at: status === "approved" ? new Date().toISOString() : null })
    .eq("id", id);
  revalidatePath("/admin");
}
