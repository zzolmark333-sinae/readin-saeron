import { notFound } from "next/navigation";
import { readDB } from "@/lib/store";
import { setPostStatus, deletePost } from "@/lib/actions";
import { SOURCE_LABEL } from "@/lib/format";
import PostView from "./PostView";

export const dynamic = "force-dynamic";

export default async function PostPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const db = await readDB();
  const p = db.posts.find((x) => x.id === id);
  if (!p) notFound();

  const statusBtn = (status: string, label: string, ink = false) => (
    <form action={setPostStatus}>
      <input type="hidden" name="id" value={p.id} />
      <input type="hidden" name="status" value={status} />
      <button className={`btn ${ink ? "btn-ink" : "btn-line"}`}>{label}</button>
    </form>
  );

  return (
    <>
      <p className="text-sm text-grid font-bold">
        {p.series_no ? `${p.series_no}편` : SOURCE_LABEL[p.source]}{p.topic ? ` · ${p.topic}` : ""}
      </p>
      <PostView post={p} />

      <section className="mt-10 border-t border-grid-soft pt-6">
        <h2 className="font-bold">네이버에 올리셨나요?</h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {p.status !== "published" && statusBtn("published", "발행 완료", true)}
          {p.status === "ready" && statusBtn("skipped", "이 글은 건너뛰기")}
          {p.status !== "ready" && statusBtn("ready", "발행 대기로 되돌리기")}
        </div>
        {p.published_at && <p className="mt-2 text-sm text-muted">{new Date(p.published_at).toLocaleDateString("ko-KR")} 발행</p>}
        <form action={deletePost} className="mt-8">
          <input type="hidden" name="id" value={p.id} />
          <button className="text-sm text-muted underline">이 글 지우기</button>
        </form>
      </section>
    </>
  );
}
