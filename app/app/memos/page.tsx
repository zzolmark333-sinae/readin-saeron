import Link from "next/link";
import { readDB } from "@/lib/store";
import { deleteMemo } from "@/lib/actions";
import MemoForm from "./MemoForm";

export const dynamic = "force-dynamic";

const KIND = { scene: "수업 장면", event: "특별 행사", direction: "글 방향" } as const;

export default async function MemosPage() {
  const db = await readDB();
  const memos = [...db.memos].sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <>
      <h1 className="font-serif text-2xl font-bold">메모</h1>
      <p className="mt-2 text-muted leading-7">수업하다 떠오른 장면, 행사 소식, 다음 글 방향을 짧게 남겨 두면 연재 글의 재료가 돼요.</p>
      <MemoForm />

      <h2 className="mt-12 font-bold">남긴 메모</h2>
      {!memos.length ? <p className="mt-3 text-muted">아직 메모가 없어요.</p> : (
        <ul className="mt-3 border-t border-grid-soft">
          {memos.map((m) => (
            <li key={m.id} className="py-4 border-b border-grid-soft grid gap-1 sm:grid-cols-[1fr_auto] sm:items-start">
              <div>
                <p className="text-xs text-muted">
                  {KIND[m.kind]} · {new Date(m.created_at).toLocaleDateString("ko-KR")}
                  {m.target_date && ` · ${m.target_date} 글에 반영`}
                </p>
                {m.event ? (
                  <p className="mt-1"><b>{m.event.name}</b> {m.event.date && `· ${m.event.date}`} {m.event.deadline && `· 마감 ${m.event.deadline}`}</p>
                ) : null}
                {m.body && <p className="mt-1 whitespace-pre-line">{m.body}</p>}
                {m.used_post_id
                  ? <Link href={`/posts/${m.used_post_id}`} className="text-sm text-grid font-semibold">글에 쓰였어요 →</Link>
                  : <p className="text-sm text-grid">다음 글 재료로 대기 중</p>}
              </div>
              <form action={deleteMemo}>
                <input type="hidden" name="id" value={m.id} />
                <button className="text-sm text-muted underline">지우기</button>
              </form>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
