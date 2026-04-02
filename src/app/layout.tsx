import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/layout/bottom-nav";
import { SidebarNav } from "@/components/layout/sidebar-nav";
import { SessionProvider } from "@/components/providers/session-provider";
import "./globals.css";

const notoSansJP = Noto_Sans_JP({
  variable: "--font-noto-sans-jp",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "レシートプランナー",
  description: "レシートから支出を自動抽出し、予算を管理するアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${notoSansJP.variable} h-full antialiased`}>
      <body className="min-h-full font-[family-name:var(--font-noto-sans-jp)]">
        <SessionProvider>
          <div className="flex min-h-screen">
            {/* PC: サイドバー */}
            <SidebarNav />

            {/* メインコンテンツ */}
            <main className="flex-1 pb-20 md:pb-6">
              <div className="mx-auto max-w-lg px-4 py-4 md:max-w-5xl md:px-8 md:py-6">
                {children}
              </div>
            </main>
          </div>

          {/* スマホ: ボトムナビ */}
          <div className="md:hidden">
            <BottomNav />
          </div>

          <Toaster position="top-center" />
        </SessionProvider>
      </body>
    </html>
  );
}
