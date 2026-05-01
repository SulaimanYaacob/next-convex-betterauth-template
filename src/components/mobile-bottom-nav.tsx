"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabConfig {
  href: string;
  label: string;
  Icon: typeof House;
  match: (pathname: string) => boolean;
}

const TABS: readonly TabConfig[] = [
  {
    href: "/",
    label: "Home",
    Icon: House,
    match: (p) => p === "/",
  },
  {
    href: "/store",
    label: "Store",
    Icon: ShoppingBag,
    match: (p) => p.startsWith("/store"),
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Main navigation"
      className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-background border-t border-border h-16"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="flex h-full">
        {TABS.map((tab) => {
          const isActive = tab.match(pathname);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px] focus-visible:ring-2 focus-visible:ring-ring",
                isActive ? "text-primary" : "text-muted-foreground",
              )}
            >
              <tab.Icon className="size-5" aria-hidden="true" />
              <span className="text-xs">{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
