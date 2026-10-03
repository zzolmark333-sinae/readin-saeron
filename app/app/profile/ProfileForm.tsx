"use client";
import { useActionState } from "react";
import { saveProfile, type ActionState } from "@/lib/actions";
import type { AcademyProfile } from "@/lib/store";

const Radio = ({ name, options, value }: { name: string; options: string[]; value: string }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => <label key={o} className="chip"><input type="radio" name={name} value={o} defaultChecked={value === o} />{o}</label>)}
  </div>
);
const Checks = ({ name, options, value }: { name: string; options: string[]; value: string[] }) => (
  <div className="flex flex-wrap gap-2">
    {options.map((o) => <label key={o} className="chip"><input type="checkbox" name={name} value={o} defaultChecked={value.includes(o)} />{o}</label>)}
  </div>
);

export default function ProfileForm({ profile: p }: { profile: AcademyProfile }) {
  const [state, action, pending] = useActionState<ActionState, FormData>(saveProfile, {});
  return (
    <form action={action} className="grid gap-6">
      <fieldset className="field"><legend className="font-semibold text-sm mb-2">화자</legend><Radio name="speaker" options={["원장님", "강사·선생님"]} value={p.speaker} /></fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field"><label htmlFor="academy_name">학원명</label><input id="academy_name" name="academy_name" defaultValue={p.academy_name} /></div>
        <div className="field"><label htmlFor="director_name">원장님 이름</label><input id="director_name" name="director_name" defaultValue={p.director_name} /></div>
        <div className="field sm:col-span-2"><label htmlFor="region">지역 (동 단위, 검색 키워드로 쓰여요)</label><input id="region" name="region" defaultValue={p.region} placeholder="예: ○○시 ○○구 ○○동" /></div>
      </div>
      <fieldset className="field"><legend className="font-semibold text-sm mb-2">형태</legend><Radio name="kind" options={["학원", "교습소", "공부방", "개인과외"]} value={p.kind} /></fieldset>
      <fieldset className="field"><legend className="font-semibold text-sm mb-2">대상</legend><Checks name="targets" options={["초등", "중등", "고등"]} value={p.targets} /></fieldset>
      <fieldset className="field"><legend className="font-semibold text-sm mb-2">주력 과정</legend><Checks name="courses" options={["독서", "국어", "논술", "문해력", "글쓰기"]} value={p.courses} /></fieldset>
      <fieldset className="field"><legend className="font-semibold text-sm mb-2">문의 채널</legend><Radio name="contact_channel" options={["전화", "카카오톡 채널", "네이버 톡톡"]} value={p.contact_channel} /></fieldset>
      <div className="field"><label htmlFor="contact_detail">문의처 (전화번호·채널명)</label><input id="contact_detail" name="contact_detail" defaultValue={p.contact_detail} /></div>
      <fieldset className="field"><legend className="font-semibold text-sm mb-2">글 말투</legend><Radio name="tone" options={["따뜻하게", "담백하게"]} value={p.tone} /></fieldset>
      {state.ok && <p className="text-grid text-sm">{state.ok}</p>}
      <button className="btn btn-ink" disabled={pending}>{pending ? "저장 중…" : "저장"}</button>
    </form>
  );
}
