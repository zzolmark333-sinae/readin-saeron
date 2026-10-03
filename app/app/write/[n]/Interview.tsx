"use client";
import { useEffect, useRef, useState } from "react";
import type { Question } from "@/lib/questions";
import { saveAnswer, generateSeries } from "@/lib/actions";
import GenerateButton from "@/components/GenerateButton";

export default function Interview({ no, questions, initial, hasPost }: {
  no: number; questions: Question[]; initial: Record<string, string>; hasPost: boolean;
}) {
  const [answers, setAnswers] = useState(initial);
  const [i, setI] = useState(0);
  const [saved, setSaved] = useState<"" | "saving" | "saved">("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSave = useRef<{ qid: string; value: string } | null>(null);
  const q = questions[i];
  const last = i === questions.length - 1;
  const missing = questions.filter((x) => x.required && !answers[x.id]?.trim());

  // 입력이 멈추면 저장하고, 다른 질문으로 넘어가거나 글을 만들 때는 바로 저장
  const flush = async () => {
    if (timer.current) clearTimeout(timer.current);
    const p = pendingSave.current;
    pendingSave.current = null;
    if (p) { await saveAnswer(no, p.qid, p.value); setSaved("saved"); }
  };
  const onChange = (v: string) => {
    setAnswers((a) => ({ ...a, [q.id]: v }));
    setSaved("saving");
    pendingSave.current = { qid: q.id, value: v };
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(flush, 700);
  };
  const go = (to: number) => { void flush(); setI(to); };
  useEffect(() => () => { void flush(); }, []);

  return (
    <div className="mt-8">
      <div className="h-2 rounded-full bg-grid-soft overflow-hidden" aria-hidden>
        <div className="h-full bg-grid transition-all" style={{ width: `${((i + 1) / questions.length) * 100}%` }} />
      </div>
      <p className="mt-2 text-xs text-muted">질문 {i + 1} / {questions.length} {saved === "saving" ? "· 저장 중…" : saved === "saved" ? "· 저장됨" : ""}</p>

      <div className="field mt-6">
        <label htmlFor="answer" className="!text-lg leading-8">
          {q.required && <span className="text-warn mr-1">(필수)</span>}{q.question}
        </label>
        <p className="text-sm text-muted">{q.why}</p>
        <textarea id="answer" rows={8} value={answers[q.id] ?? ""} onChange={(e) => onChange(e.target.value)}
          placeholder={q.example ? `예시) ${q.example}` : "아는 것만 적어 주세요. 비워 둬도 돼요."} />
      </div>

      <div className="mt-4 flex gap-2">
        <button type="button" className="btn btn-line" onClick={() => go(i - 1)} disabled={i === 0}>이전</button>
        {!last && <button type="button" className="btn btn-ink" onClick={() => go(i + 1)}>다음</button>}
      </div>

      {last && (
        <div className="mt-10 border-t border-grid-soft pt-6">
          {missing.length > 0 && (
            <p className="mb-3 text-sm text-warn">필수 질문 {missing.map((m) => questions.indexOf(m) + 1).join(", ")}번에 답하면 글을 만들 수 있어요.</p>
          )}
          <GenerateButton action={async () => { await flush(); return generateSeries(no); }} label={hasPost ? "이 편 글 다시 만들기" : "완성본 만들기"}
            confirmText={hasPost ? "이미 만든 글이 있어요. 새로 한 편 더 만들까요? (기존 글은 그대로 남아요)" : undefined}
            disabled={missing.length > 0} />
        </div>
      )}
    </div>
  );
}
