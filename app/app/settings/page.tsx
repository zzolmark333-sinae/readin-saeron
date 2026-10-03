import { readDB } from "@/lib/store";
import SettingsForm from "./SettingsForm";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const db = await readDB();
  const month = new Date().toISOString().slice(0, 7);
  const usage = db.usage.filter((u) => u.at.startsWith(month));
  const out = usage.reduce((s, u) => s + u.output_tokens, 0);
  const inp = usage.reduce((s, u) => s + u.input_tokens, 0);
  return (
    <>
      <h1 className="font-serif text-2xl font-bold">설정</h1>
      <SettingsForm settings={db.settings} />
      <section className="mt-12 rounded-xl border border-grid-soft bg-white p-5 text-sm leading-7">
        <h2 className="font-bold">이번 달 사용량</h2>
        <p>글 {usage.length}편 생성 · 입력 {inp.toLocaleString()} / 출력 {out.toLocaleString()} 토큰</p>
        <p className="text-muted">정확한 요금은 console.anthropic.com 의 Usage 화면에서 확인할 수 있어요.</p>
      </section>
    </>
  );
}
