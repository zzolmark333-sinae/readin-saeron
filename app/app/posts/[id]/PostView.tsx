"use client";
import { useState } from "react";
import type { Post } from "@/lib/store";
import { toBlocks, toPlain } from "@/lib/format";

function CopyButton({ text, label }: { text: string; label: string }) {
  const [done, setDone] = useState(false);
  return (
    <button type="button" className="btn btn-line min-h-9 px-3 text-sm"
      onClick={async () => { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1500); }}>
      {done ? "복사됨" : label}
    </button>
  );
}

function Para({ text, highlight }: { text: string; highlight: string }) {
  const at = highlight ? text.indexOf(highlight) : -1;
  const lines = (s: string) => s.split("\n").flatMap((l, i) => (i ? [<br key={i} />, l] : [l]));
  if (at < 0) return <p>{lines(text)}</p>;
  return (
    <p>
      {lines(text.slice(0, at))}
      <mark className="highlight bg-transparent">{highlight}</mark>
      {lines(text.slice(at + highlight.length))}
    </p>
  );
}

export default function PostView({ post }: { post: Post }) {
  const blocks = toBlocks(post.body);
  const plain = toPlain(post.body);
  const photos = blocks.filter((b) => b.type === "photo");
  return (
    <>
      <section className="mt-4">
        <h2 className="text-sm font-bold text-muted">제목 후보</h2>
        <ul className="mt-2 grid gap-2">
          {post.titles.map((t, i) => (
            <li key={i} className="flex items-center justify-between gap-3 rounded-lg border border-grid-soft bg-white px-4 py-3">
              <span className="font-serif text-lg font-bold">{t}</span>
              <CopyButton text={t} label="복사" />
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-sm font-bold text-muted">본문 · 공백 포함 {plain.length.toLocaleString()}자</h2>
        <div className="flex gap-2">
          <CopyButton text={plain} label="본문 복사" />
          <a className="btn btn-line min-h-9 px-3 text-sm" href={`/api/posts/${post.id}/docx`}>워드 받기</a>
        </div>
      </div>
      <article className="mt-3 grid gap-5 rounded-xl border border-grid-soft bg-white p-5 sm:p-8 text-[1.05rem] leading-8">
        {blocks.map((b, i) =>
          b.type === "photo"
            ? <div key={i} className="photo-box">📷 사진 추천 — {b.text}</div>
            : <Para key={i} text={b.text} highlight={post.highlight} />)}
      </article>

      {photos.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-bold text-muted">찍어 둘 사진</h2>
          <ol className="mt-2 list-decimal pl-5 leading-7">{photos.map((p, i) => <li key={i}>{p.text}</li>)}</ol>
        </section>
      )}
    </>
  );
}
