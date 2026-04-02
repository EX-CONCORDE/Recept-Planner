"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { SavingsSidebar } from "@/components/savings/savings-sidebar";
import {
  LayoutDashboard,
  Receipt,
  ListPlus,
  Tag,
  Settings,
  Users,
  LogOut,
} from "lucide-react";

const navItems = [
  { href: "/", label: "ダッシュボード", icon: LayoutDashboard },
  { href: "/expenses", label: "支出・収入", icon: ListPlus },
  { href: "/upload", label: "レシート撮影", icon: Receipt },
  { href: "/categories", label: "カテゴリ管理", icon: Tag },
  { href: "/settings", label: "月次設定", icon: Settings },
];

export function SidebarNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  // ログインページではサイドバーを表示しない
  if (pathname === "/login") return null;

  return (
    <aside className="hidden md:flex md:w-56 lg:w-64 shrink-0 flex-col border-r bg-background h-screen sticky top-0">
      <div className="px-4 py-5 border-b">
        <h1 className="text-lg font-bold">レシートプランナー</h1>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary font-semibold"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-5 w-5 shrink-0" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
              pathname === "/admin"
                ? "bg-primary/10 text-primary font-semibold"
                : "text-muted-foreground hover:bg-secondary hover:text-foreground"
            }`}
          >
            <Users className="h-5 w-5 shrink-0" />
            <span>ユーザー管理</span>
          </Link>
        )}
      </nav>
      <SavingsSidebar />

      {/* ユーザー情報 + ログアウト */}
      {session?.user && (
        <div className="border-t px-3 py-3">
          <div className="flex items-center justify-between px-2">
            <div className="min-w-0">
              <p className="text-xs font-medium truncate">
                {session.user.name}
              </p>
              <p className="text-[10px] text-muted-foreground truncate">
                {session.user.email}
              </p>
            </div>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary"
              title="ログアウト"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
}
