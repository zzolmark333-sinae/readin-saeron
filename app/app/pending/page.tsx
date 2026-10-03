import Header from "@/components/Header";
import { getMe } from "@/lib/auth";

const MESSAGE = {
  pending: { title: "승인을 기다리고 있어요", body: "관리자가 신청 내용을 확인하고 있어요. 승인되면 이 주소로 다시 들어오시면 바로 쓸 수 있어요." },
  rejected: { title: "가입이 승인되지 않았어요", body: "자세한 내용은 관리자에게 문의해 주세요." },
  suspended: { title: "이용이 일시 정지됐어요", body: "다시 이용하시려면 관리자에게 문의해 주세요." },
} as const;

export default async function PendingPage() {
  const { profile } = await getMe();
  const s = profile?.status && profile.status !== "approved" ? profile.status : "pending";
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-5 py-16">
        <h1 className="font-serif text-2xl font-bold">{MESSAGE[s].title}</h1>
        <p className="mt-3 text-muted leading-7">{MESSAGE[s].body}</p>
        {profile?.academy_name && (
          <dl className="mt-8 border-t border-grid-soft pt-4 grid grid-cols-[5rem_1fr] gap-y-2 text-sm">
            <dt className="text-muted">학원</dt><dd>{profile.academy_name}</dd>
            <dt className="text-muted">지역</dt><dd>{profile.region}</dd>
          </dl>
        )}
      </main>
    </>
  );
}
