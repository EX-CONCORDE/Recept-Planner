"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
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
  { href: "/", label: "ホーム", icon: LayoutDashboard },
  { href: "/expenses", label: "支出", icon: ListPlus },
  { href: "/upload", label: "撮影", icon: Receipt },
  { href: "/categories", label: "分類", icon: Tag },
  { href: "/settings", label: "設定", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const isAdmin = session?.user?.role === "admin";

  // ログインページではボトムナビを表示しない
  if (pathname === "/login") return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-background">
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
        {isAdmin && (
          <Link
            href="/admin"
            className={`flex flex-col items-center gap-0.5 px-3 py-1 text-xs transition-colors ${
              pathname === "/admin"
                ? "text-primary font-semibold"
                : "text-muted-foreground"
            }`}
          >
            <Users className="h-5 w-5" />
            <span>管理</span>
          </Link>
        )}
        {session?.user && (
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="flex flex-col items-center gap-0.5 px-3 py-1 text-xs text-muted-foreground"
          >
            <LogOut className="h-5 w-5" />
            <span>退出</span>
          </button>
        )}
      </div>
    </nav>
  );
}
