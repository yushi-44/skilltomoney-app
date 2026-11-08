import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "스킬투머니 | 배운 기술이 돈이 되는 원데이 클래스",
  description: "배운 기술이 돈이 되는 원데이 클래스, 스킬투머니 강좌 목록입니다.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#0b1329] text-white font-sans">
        {children}
      </body>
    </html>
  );
}
