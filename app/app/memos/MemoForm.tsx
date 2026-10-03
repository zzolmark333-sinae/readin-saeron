"use client";
import { useActionState, useState } from "react";
import { addMemo, type ActionState } from "@/lib/actions";

const KINDS = [
  { key: "scene", label: "수업 장면", ph: "예) 오늘 3학년 아이가 낭독하다 멈추더니 '이 사람 왜 울어요?' 하고 물었다." },
  { key: "event", label: "특별 행사", ph: "덧붙일 말 (선택)" },
  { key: "direction", label: "글 방향", ph: "예) 이번엔 중등 내신 대비를 강조해 줘." },
] as const;

export default function MemoForm() {
  const [kind, setKind] = useState<(typeof KINDS)[number]["key"]>("scene");
  const [state, action, pending] = useActionState<ActionState, FormData>(addMemo, {});
  const k = KINDS.find((x) => x.key === kind)!;

  return (
    <form action={action} key={state.ok ? Date.now() : "form"} className="mt-6 grid gap-4 rounded-xl border border-grid-soft bg-white p-5">
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="메모 종류">
        {KINDS.map((x) => (
          <label key={x.key} className="chip">
            <input type="radio" name="kind" value={x.key} checked={kind === x.key} onChange={() => setKind(x.key)} />{x.label}
          </label>
        ))}
      </div>

      {kind === "event" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="field sm:col-span-2"><label htmlFor="name">행사명</label><input id="name" name="name" required /></div>
          <div className="field"><label htmlFor="date">일시</label><input id="date" name="date" placeholder="예: 7월 22일(화)~8월 14일, 주 2회" /></div>
          <div className="field"><label htmlFor="target">대상</label><input id="target" name="target" placeholder="예: 중1~3" /></div>
          <div className="field sm:col-span-2"><label htmlFor="detail">내용</label><textarea id="detail" name="detail" rows={2} /></div>
          <div className="field"><label htmlFor="how_to_apply">신청 방법</label><input id="how_to_apply" name="how_to_apply" placeholder="예: 전화 또는 카톡 채널" /></div>
          <div className="field"><label htmlFor="deadline">마감일</label><input id="deadline" name="deadline" type="date" /></div>
        </div>
      )}

      <div className="field">
        <label htmlFor="body">{kind === "event" ? "덧붙일 말" : "메모"}</label>
        <textarea id="body" name="body" rows={kind === "event" ? 2 : 3} placeholder={k.ph} required={kind !== "event"} />
      </div>
      <div className="field max-w-xs">
        <label htmlFor="target_date">특정 날짜 글에 반영 (비우면 다음 글)</label>
        <input id="target_date" name="target_date" type="date" />
      </div>

      {state.error && <p className="text-warn text-sm">{state.error}</p>}
      {state.ok && <p className="text-grid text-sm">{state.ok}</p>}
      <button className="btn btn-ink" disabled={pending}>{pending ? "남기는 중…" : "메모 남기기"}</button>
    </form>
  );
}
