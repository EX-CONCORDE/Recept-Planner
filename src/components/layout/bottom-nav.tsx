"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, Receipt, ListPlus, RefreshCw, Tag, Settings } from "lucide-react";

const navItems = [
  { href: "/", label: "ホーム", icon: LayoutDashboard },
  { href: "/expenses", label: "支出", icon: ListPlus },
  { href: "/upload", label: "撮影", icon: Receipt },
  { href: "/subscriptions", label: "サブスク", icon: RefreshCw },
  { href: "/categories", label: "分類", icon: Tag },
  { href: "/settings", label: "設定", icon: Settings },
];

export function BottomNav() {
  const pathname = usePathname();

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
              className={`flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] sm:text-xs transition-colors ${
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
      </div>
    </nav>
  );
}
