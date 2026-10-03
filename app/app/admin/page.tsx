import Link from "next/link";
import Header from "@/components/Header";
import { requireAdmin, type Profile } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/admin";
import { setStatus } from "./actions";

const TABS = [
  { key: "pending", label: "승인 대기" },
  { key: "approved", label: "이용 중" },
  { key: "suspended", label: "정지" },
  { key: "rejected", label: "거절" },
] as const;

const ACTIONS: Record<string, { status: string; label: string; ink?: boolean }[]> = {
  pending: [{ status: "approved", label: "승인", ink: true }, { status: "rejected", label: "거절" }],
  approved: [{ status: "suspended", label: "정지" }],
  suspended: [{ status: "approved", label: "다시 승인", ink: true }],
  rejected: [{ status: "approved", label: "승인", ink: true }],
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("ko-KR", { month: "short", day: "numeric" }) : "";

export default async function AdminPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { user } = await requireAdmin();
  const { s } = await searchParams;
  const tab = TABS.find((t) => t.key === s)?.key ?? "pending";

  const db = createAdminClient();
  const { data: rows } = await db
    .from("profiles").select("*")
    .eq("status", tab).eq("is_admin", false)
    .not("signup_completed_at", "is", null)
    .order("created_at", { ascending: false })
    .returns<Profile[]>();

  const { data: all } = await db
    .from("profiles").select("status").eq("is_admin", false).not("signup_completed_at", "is", null);
  const count = (k: string) => (all ?? []).filter((r) => r.status === k).length;

  return (
    <>
      <Header admin />
      <main className="mx-auto max-w-3xl px-5 py-10">
        <h1 className="font-serif text-2xl font-bold">회원 관리</h1>

        <nav className="mt-6 flex gap-2 overflow-x-auto" aria-label="회원 상태">
          {TABS.map((t) => (
            <Link key={t.key} href={`/admin?s=${t.key}`}
              aria-current={tab === t.key ? "page" : undefined}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm border ${
                tab === t.key ? "bg-ink text-white border-ink" : "bg-white border-grid-soft"}`}>
              {t.label} {count(t.key)}
            </Link>
          ))}
        </nav>

        {!rows?.length ? (
          <p className="mt-10 text-muted">
            {tab === "pending" ? "새 가입 신청이 없어요. 앱 주소를 원장님들께 공유하면 여기에 신청이 쌓여요." : "해당하는 회원이 없어요."}
          </p>
        ) : (
          <ul className="mt-6 border-t border-grid-soft">
            {rows.map((r) => (
              <li key={r.id} className="py-5 border-b border-grid-soft grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="font-bold">{r.academy_name} <span className="font-normal text-muted">· {r.name}</span></p>
                  <p className="text-sm text-muted mt-1">{r.region} / {r.phone} / {r.email}</p>
                  {r.signup_note && <p className="text-sm mt-1">“{r.signup_note}”</p>}
                  <p className="text-xs text-muted mt-1">
                    신청 {fmt(r.signup_completed_at)}{r.approved_at && ` / 승인 ${fmt(r.approved_at)}`}
                  </p>
                </div>
                {r.id !== user.id && (
                  <div className="flex gap-2">
                    {ACTIONS[tab].map((a) => (
                      <form key={a.status} action={setStatus}>
                        <input type="hidden" name="id" value={r.id} />
                        <input type="hidden" name="status" value={a.status} />
                        <button className={`btn min-h-10 px-4 text-sm ${a.ink ? "btn-ink" : "btn-line"}`}>{a.label}</button>
                      </form>
                    ))}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </>
  );
}
