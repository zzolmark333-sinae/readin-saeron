"use client";
import { useActionState } from "react";
import { saveSettings, type ActionState } from "@/lib/actions";
import type { Settings } from "@/lib/store";
import { WEEKDAYS } from "@/lib/kst";

export default function SettingsForm({ settings: s }: { settings: Settings }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveSettings, {});
  return (
    <form action={action} className="mt-8 grid gap-6">
      <label className="chip w-fit"><input type="checkbox" name="active" defaultChecked={s.active} />자동 연재 켜기</label>
      <fieldset className="field">
        <legend className="font-semibold text-sm mb-2">연재 요일 (새벽 5시 이후 한 편)</legend>
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5, 6, 0].map((d) => (
            <label key={d} className="chip"><input type="checkbox" name="weekdays" value={d} defaultChecked={s.weekdays.includes(d)} />{WEEKDAYS[d]}</label>
          ))}
        </div>
      </fieldset>
      <label className="chip w-fit"><input type="checkbox" name="event_reminder" defaultChecked={s.event_reminder} />행사 마감 2일 전 리마인드 글도 쓰기</label>
      <p className="text-sm text-muted leading-6">발행하지 않은 글이 3편 쌓이면 자동 연재가 잠시 멈춰요. 글을 발행 완료 또는 건너뛰기로 정리하면 다시 시작해요.</p>
      {state.ok && <p className="text-grid text-sm">{state.ok}</p>}
      <button className="btn btn-ink" disabled={pending}>{pending ? "저장 중…" : "저장"}</button>
    </form>
  );
}
