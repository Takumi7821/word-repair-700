import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WORD REPAIR 700",
  description: "間違いを、次の3問で直す。TOEIC700点を目指す社会人向けAI英単語コーチ。",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="min-h-screen font-display antialiased">
        <div className="mx-auto min-h-screen w-full max-w-md px-5 pb-10 pt-6 sm:max-w-lg">
          {children}
        </div>
      </body>
    </html>
  );
}
