import Header from "@/components/Header";
import { getMe } from "@/lib/auth";

const SERIES = [
  "원장 소개와 사람 이야기",
  "학원의 강점과 증거",
  "왜 우리 학원이어야 할까",
  "수업과 운영 방식",
  "아이가 달라진 이야기",
  "처음 오시는 학부모님께",
];

export default async function WritePage() {
  const { profile } = await getMe();
  return (
    <>
      <Header admin={profile?.is_admin} />
      <main className="mx-auto max-w-xl px-5 py-10">
        <h1 className="font-serif text-2xl font-bold">{profile?.name ?? "원장"}님, 반가워요</h1>
        <p className="mt-2 text-muted leading-7">여섯 편을 차례로 쓰면 학부모님이 학원을 알아 가는 흐름이 완성돼요.</p>
        <ol className="mt-8 border-t border-grid-soft">
          {SERIES.map((t, i) => (
            <li key={t} className="flex items-center justify-between py-4 border-b border-grid-soft">
              <span><span className="text-grid font-bold mr-3">{i + 1}편</span>{t}</span>
              <span className="text-sm text-muted">준비 중</span>
            </li>
          ))}
        </ol>
      </main>
    </>
  );
}
