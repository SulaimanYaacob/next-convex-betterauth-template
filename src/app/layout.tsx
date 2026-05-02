import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { ThemeProvider } from "@/components/next-theme/theme-provider";
import { ConvexClientProvider } from "./ConvexClientProvider";
import { HeartbeatProvider } from "@/components/heartbeat-provider";
import { AppShell } from "@/components/app-shell";
import { CosmeticsApplicator } from "@/components/cosmetics-applicator";
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
              <Suspense fallback={null}>
                <AppShell>{children}</AppShell>
              </Suspense>
              <CosmeticsApplicator />
              <Toaster richColors position="top-center" />
            </HeartbeatProvider>
          </ConvexClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
