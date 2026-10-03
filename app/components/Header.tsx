import Link from "next/link";
import { signOut } from "@/lib/actions";

const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "원장 글방";

export default function Header({ admin = false, signedIn = true }: { admin?: boolean; signedIn?: boolean }) {
  return (
    <header className="flex items-center justify-between px-5 py-4 border-b border-grid-soft bg-white">
      <Link href="/" className="font-serif text-lg font-bold">{APP}</Link>
      {signedIn && (
        <nav className="flex items-center gap-4 text-sm text-muted">
          {admin && <Link href="/admin">회원 관리</Link>}
          {admin && <Link href="/write">글쓰기</Link>}
          <form action={signOut}><button type="submit">로그아웃</button></form>
        </nav>
      )}
    </header>
  );
}
