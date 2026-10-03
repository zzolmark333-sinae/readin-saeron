import Link from "next/link";

const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "원장 글방";
const NAV = [
  { href: "/write", label: "6편 쓰기" },
  { href: "/posts", label: "글" },
  { href: "/memos", label: "메모" },
  { href: "/profile", label: "프로필" },
  { href: "/settings", label: "설정" },
];

export default function Header() {
  return (
    <header className="border-b border-grid-soft bg-white">
      <div className="mx-auto max-w-3xl px-5 py-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <Link href="/" className="font-serif text-lg font-bold">{APP}</Link>
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
          {NAV.map((n) => <Link key={n.href} href={n.href} className="hover:text-ink">{n.label}</Link>)}
        </nav>
      </div>
    </header>
  );
}
