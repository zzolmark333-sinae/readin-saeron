import { readDB } from "@/lib/store";
import ProfileForm from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const db = await readDB();
  return (
    <>
      <h1 className="font-serif text-2xl font-bold">학원 프로필</h1>
      <p className="mt-2 mb-8 text-muted leading-7">
        모든 글에 공통으로 쓰여요. 학원 소개·과정·원장 이력 같은 자세한 사실은 <code>app/knowledge/academy.md</code> 파일에 정리돼 있고, 글을 쓸 때 함께 참고해요.
      </p>
      <ProfileForm profile={db.profile} />
    </>
  );
}
