import { notFound } from "next/navigation";
import { readDB } from "@/lib/store";
import { getSeries } from "@/lib/questions";
import ApiKeyNotice from "@/components/Notice";
import Interview from "./Interview";

export const dynamic = "force-dynamic";

export default async function SeriesPage({ params }: { params: Promise<{ n: string }> }) {
  const { n } = await params;
  const s = getSeries(Number(n));
  if (!s) notFound();
  const db = await readDB();
  const hasPost = db.posts.some((p) => p.series_no === s.no);
  return (
    <>
      <ApiKeyNotice />
      <p className="text-sm text-grid font-bold">{s.no}편 · 목표: {s.goal}</p>
      <h1 className="font-serif text-2xl font-bold mt-1">{s.title}</h1>
      <Interview no={s.no} questions={s.questions} initial={db.interviews[s.no] ?? {}} hasPost={hasPost} />
    </>
  );
}
