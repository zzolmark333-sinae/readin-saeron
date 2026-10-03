import Link from "next/link";
import { readDB } from "@/lib/store";
import { generateNext } from "@/lib/actions";
import { SOURCE_LABEL } from "@/lib/format";
import GenerateButton from "@/components/GenerateButton";
import ApiKeyNotice from "@/components/Notice";

export const dynamic = "force-dynamic";

const TABS = [
  { key: "ready", label: "발행 대기" },
  { key: "published", label: "발행 완료" },
  { key: "skipped", label: "건너뜀" },
] as const;

export default async function PostsPage({ searchParams }: { searchParams: Promise<{ s?: string }> }) {
  const { s } = await searchParams;
  const tab = TABS.find((t) => t.key === s)?.key ?? "ready";
  const db = await readDB();
  const rows = db.posts.filter((p) => p.status === tab).sort((a, b) => b.created_at.localeCompare(a.created_at));
  const count = (k: string) => db.posts.filter((p) => p.status === k).length;

  return (
    <>
      <ApiKeyNotice />
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="font-serif text-2xl font-bold">글</h1>
        <div className="w-full sm:w-auto">
          <GenerateButton action={generateNext} label="지금 다음 연재 글 만들기" className="btn btn-line w-full" />
        </div>
      </div>
      <p className="mt-2 text-sm text-muted">연재 글은 메모(행사 → 글 방향 → 수업 장면) 순서로 재료를 쓰고, 메모가 없으면 시기에 맞는 글감으로 써요.</p>

      <nav className="mt-6 flex gap-2" aria-label="글 상태">
        {TABS.map((t) => (
          <Link key={t.key} href={`/posts?s=${t.key}`} aria-current={tab === t.key ? "page" : undefined}
            className={`rounded-full px-4 py-2 text-sm border ${tab === t.key ? "bg-ink text-white border-ink" : "bg-white border-grid-soft"}`}>
            {t.label} {count(t.key)}
          </Link>
        ))}
      </nav>

      {!rows.length ? (
        <p className="mt-10 text-muted">해당하는 글이 없어요.</p>
      ) : (
        <ul className="mt-6 border-t border-grid-soft">
          {rows.map((p) => (
            <li key={p.id} className="border-b border-grid-soft">
              <Link href={`/posts/${p.id}`} className="block py-4">
                <p className="font-semibold">{p.titles[0]}</p>
                <p className="text-xs text-muted mt-1">
                  {p.series_no ? `${p.series_no}편` : SOURCE_LABEL[p.source]}{p.topic ? ` · ${p.topic}` : ""} · {new Date(p.created_at).toLocaleDateString("ko-KR")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
