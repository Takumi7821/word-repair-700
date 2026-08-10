import type { Metadata } from "next";
import { Sora } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-sora",
  display: "swap",
});

export const metadata: Metadata = {
  title: "TOEIC700 MASTER",
  description: "AI診断・4択クイズ・暗記カードで鍛える、TOEIC700点対策の英単語学習アプリ。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" className={sora.variable}>
      <body className="min-h-screen bg-paper font-body text-ink antialiased">
        <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-10 pt-6 sm:max-w-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
