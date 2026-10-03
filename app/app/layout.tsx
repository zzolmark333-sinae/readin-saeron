import type { Metadata, Viewport } from "next";
import "./globals.css";

const APP = process.env.NEXT_PUBLIC_APP_NAME ?? "원장 글방";

export const metadata: Metadata = {
  title: APP,
  description: "국어·독서 학원 원장님의 이야기로 블로그 글을 만듭니다.",
};
export const viewport: Viewport = { width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head>
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Gowun+Batang:wght@700&display=swap" />
      </head>
      <body className="min-h-dvh">{children}</body>
    </html>
  );
}
