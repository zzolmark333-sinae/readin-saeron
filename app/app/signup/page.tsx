import Header from "@/components/Header";
import { getMe } from "@/lib/auth";
import SignupForm from "./SignupForm";

export default async function SignupPage() {
  const { profile } = await getMe();
  return (
    <>
      <Header />
      <main className="mx-auto max-w-md px-5 py-10">
        <h1 className="font-serif text-2xl font-bold">가입 신청</h1>
        <p className="mt-2 mb-8 text-muted leading-7">관리자가 확인한 뒤 승인해 드려요. 연락처는 승인 확인용으로만 써요.</p>
        <SignupForm defaultName={profile?.name ?? ""} />
      </main>
    </>
  );
}
