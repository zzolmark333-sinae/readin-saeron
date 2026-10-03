"use client";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

type Result = { error?: string; id?: string };

export default function GenerateButton({ action, label, confirmText, className = "btn btn-ink", disabled }: {
  action: () => Promise<Result>; label: string; confirmText?: string; className?: string; disabled?: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState("");
  const router = useRouter();

  const run = () => {
    if (confirmText && !window.confirm(confirmText)) return;
    setError("");
    start(async () => {
      const r = await action();
      if (r.error) setError(r.error);
      else if (r.id) router.push(`/posts/${r.id}`);
    });
  };

  return (
    <div className="grid gap-2">
      <button type="button" className={className} onClick={run} disabled={pending || disabled}>
        {pending ? <><span className="spinner" aria-hidden />글을 쓰는 중이에요… (1~2분)</> : label}
      </button>
      {error && <p className="text-warn text-sm" role="alert">{error}</p>}
    </div>
  );
}
