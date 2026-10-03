"use client";
import { useActionState } from "react";
import { submitSignup, type SignupState } from "./actions";

export default function SignupForm({ defaultName }: { defaultName: string }) {
  const [state, action, pending] = useActionState<SignupState, FormData>(submitSignup, {});
  return (
    <form action={action} className="grid gap-5">
      <div className="field"><label htmlFor="name">이름</label>
        <input id="name" name="name" defaultValue={defaultName} required /></div>
      <div className="field"><label htmlFor="academy_name">학원명</label>
        <input id="academy_name" name="academy_name" placeholder="예: 새론독서국어학원" required /></div>
      <div className="field"><label htmlFor="region">지역 (동까지)</label>
        <input id="region" name="region" placeholder="예: 대구 동구 각산동" required /></div>
      <div className="field"><label htmlFor="phone">연락처</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" placeholder="010-0000-0000" required /></div>
      <div className="field"><label htmlFor="signup_note">어떻게 알고 오셨나요? (선택)</label>
        <textarea id="signup_note" name="signup_note" rows={2} /></div>
      {state.error && <p className="text-warn text-sm">{state.error}</p>}
      <button className="btn btn-ink" disabled={pending}>{pending ? "보내는 중…" : "가입 신청 보내기"}</button>
    </form>
  );
}
