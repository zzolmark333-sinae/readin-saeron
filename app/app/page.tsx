import Link from "next/link";
import { readDB } from "@/lib/store";
import { SERIES } from "@/lib/questions";
import { autoStatus } from "@/lib/posts";
import { WEEKDAYS } from "@/lib/kst";
import ApiKeyNotice from "@/components/Notice";

export const dynamic = "force-dynamic";

export default async function Home() {
  const db = await readDB();
  const seriesDone = SERIES.filter((s) => db.posts.some((p) => p.series_no === s.no)).length;
  const ready = db.posts.filter((p) => p.status === "ready").sort((a, b) => b.created_at.localeCompare(a.created_at));
  const openMemos = db.memos.filter((m) => !m.used_post_id).length;
  const auto = autoStatus(db);
  const days = db.settings.weekdays.map((d) => WEEKDAYS[d]).join("·") || "없음";

  return (
    <>
      <ApiKeyNotice />
      <h1 className="font-serif text-2xl font-bold">{db.profile.director_name || "원장"}님, 오늘도 반가워요</h1>

      <section className="mt-8 grid gap-3 sm:grid-cols-3">
        <Link href="/write" className="rounded-xl border border-grid-soft bg-white p-5">
          <p className="text-sm text-muted">6편 시리즈</p>
          <p className="mt-1 text-2xl font-bold">{seriesDone} / 6편</p>
        </Link>
        <Link href="/posts" className="rounded-xl border border-grid-soft bg-white p-5">
          <p className="text-sm text-muted">발행 기다리는 글</p>
          <p className="mt-1 text-2xl font-bold">{ready.length}편</p>
        </Link>
        <Link href="/memos" className="rounded-xl border border-grid-soft bg-white p-5">
          <p className="text-sm text-muted">아직 안 쓴 메모</p>
          <p className="mt-1 text-2xl font-bold">{openMemos}개</p>
        </Link>
      </section>

      <section className="mt-8 rounded-xl border border-grid-soft bg-white p-5 leading-7">
        <h2 className="font-bold">자동 연재</h2>
        <p className="text-sm text-muted mt-1">
          {db.settings.active ? `매주 ${days}요일 새벽 5시 이후, 메모를 재료로 글을 한 편씩 써 둬요.` : "꺼져 있어요."}{" "}
          <Link href="/settings" className="underline">바꾸기</Link>
        </p>
        <p className="text-sm mt-2">{auto.due ? "오늘 글을 곧 준비해요." : auto.reason}</p>
        <p className="text-xs text-muted mt-2">이 앱(npm run dev)이 켜져 있는 동안 동작해요. 꺼져 있었다면 다음에 켤 때 그날 글을 써요.</p>
      </section>

      {ready.length > 0 && (
        <section className="mt-8">
          <h2 className="font-bold">발행 기다리는 글</h2>
          <ul className="mt-3 border-t border-grid-soft">
            {ready.map((p) => (
              <li key={p.id} className="border-b border-grid-soft">
                <Link href={`/posts/${p.id}`} className="block py-3">
                  {p.titles[0]}
                  <span className="ml-2 text-xs text-muted">{p.series_no ? `${p.series_no}편` : p.topic}</span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
