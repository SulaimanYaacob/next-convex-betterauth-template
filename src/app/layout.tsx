import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/next-theme/theme-provider";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { HeartbeatProvider } from "@/components/heartbeat-provider";
import { AppNav } from "@/components/app-nav";
import { MobileNav } from "@/components/mobile-nav";
import { MobileBottomNav } from "@/components/mobile-bottom-nav";
import { GuestBanner } from "@/components/guest-banner";
import { Toaster } from "sonner";

const geistMono = Geist_Mono({
  variable: "--font-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gami",
  description: "Play. Earn. Show off.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistMono.variable} min-h-svh w-full bg-background antialiased`}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ConvexClientProvider>
            <HeartbeatProvider>
              <GuestBanner />
              <AppNav />
              <MobileNav />
              <main className="pt-16 md:pt-16 [@media(max-width:767px)]:pt-[104px] pb-16 md:pb-0 flex flex-col">
                {children}
              </main>
              <MobileBottomNav />
              <Toaster richColors position="top-center" />
            </HeartbeatProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
