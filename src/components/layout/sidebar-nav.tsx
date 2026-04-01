"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Receipt,
  ListPlus,
  Tag,
  Settings,
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
      </nav>
    </aside>
  );
}
