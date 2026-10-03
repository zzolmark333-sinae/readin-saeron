import Link from "next/link";
import { readDB } from "@/lib/store";
import { SERIES } from "@/lib/questions";
import ApiKeyNotice from "@/components/Notice";

export const dynamic = "force-dynamic";

export default async function WritePage() {
  const db = await readDB();
  return (
    <>
      <ApiKeyNotice />
      <h1 className="font-serif text-2xl font-bold">6편 시리즈</h1>
      <p className="mt-2 text-muted leading-7">여섯 편을 차례로 쓰면 학부모님이 학원을 알아 가는 흐름이 완성돼요. 질문에 답하면 자동 저장돼요.</p>
      <ol className="mt-8 border-t border-grid-soft">
        {SERIES.map((s) => {
          const a = db.interviews[s.no] ?? {};
          const answered = s.questions.filter((q) => a[q.id]?.trim()).length;
          const post = db.posts.filter((p) => p.series_no === s.no).sort((x, y) => y.created_at.localeCompare(x.created_at))[0];
          return (
            <li key={s.no} className="flex items-center justify-between gap-4 py-4 border-b border-grid-soft">
              <Link href={`/write/${s.no}`} className="flex-1">
                <span className="text-grid font-bold mr-3">{s.no}편</span>{s.title}
                <span className="block text-xs text-muted mt-1">목표: {s.goal} · 답변 {answered}/{s.questions.length}</span>
              </Link>
              {post
                ? <Link href={`/posts/${post.id}`} className="text-sm text-grid font-semibold whitespace-nowrap">{post.status === "published" ? "발행 완료" : "글 보기"}</Link>
                : <span className="text-sm text-muted whitespace-nowrap">{answered ? "작성 중" : "시작 전"}</span>}
            </li>
          );
        })}
      </ol>
    </>
  );
}
