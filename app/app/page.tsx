import LoginButtons from "@/components/LoginButtons";

const TITLE = "답하면 글이 됩니다";

export default async function Home({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto max-w-2xl px-5 py-16 sm:py-24">
      <h1 className="manuscript" aria-label={TITLE}>
        {[...TITLE].map((ch, i) =>
          <span key={i} aria-hidden className={ch === " " ? "blank" : ""}>{ch === " " ? "" : ch}</span>)}
      </h1>

      <p className="mt-10 text-lg leading-8 max-w-[34rem]">
        국어·독서 학원 원장님이 질문에 답하시면, 원장님 이야기가 담긴 블로그 글을 만들어 드려요.
        글은 원장님이 확인하고 직접 올리시면 됩니다.
      </p>

      <ol className="mt-8 grid gap-2 text-muted leading-7">
        <li>1. 카카오나 구글로 로그인하고 가입 신청을 남겨요.</li>
        <li>2. 관리자가 승인하면 바로 쓸 수 있어요. 승인된 원장님만 이용할 수 있어요.</li>
        <li>3. 질문에 답하면 글이 완성돼요.</li>
      </ol>

      <div className="mt-10"><LoginButtons /></div>
      {error && <p className="mt-4 text-warn text-sm">로그인하지 못했어요. 다시 시도해 주세요.</p>}
    </main>
  );
}
