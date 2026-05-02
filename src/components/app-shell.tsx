"use client";

import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { AppNav } from "@/components/app-nav";
import { MobileNav } from "@/components/mobile-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { GuestBanner } from "@/components/guest-banner";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isGameFrame = pathname.startsWith("/games/");

  if (isGameFrame) {
    return <>{children}</>;
  }

  return (
    <>
      <GuestBanner />
      <Suspense fallback={null}>
        <AppNav />
        <MobileNav />
      </Suspense>
      <main className="flex flex-col pb-16 pt-16 md:pb-0 md:pt-16 [@media(max-width:767px)]:pt-[104px]">
        {children}
      </main>
      <Suspense fallback={null}>
        <MobileBottomNav />
      </Suspense>
    </>
  );
}
