import { Sora } from "next/font/google";
import type { ReactNode } from "react";

const sora = Sora({
  variable: "--font-sora",
  subsets: ["latin"],
  weight: ["600"],
  display: "swap",
});

export default function UnAuthLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${sora.variable} flex-1 flex flex-col items-center justify-center gap-8 px-4 py-12`}
      style={{ backgroundColor: "#f8f6f2", colorScheme: "light" }}
      data-theme="light"
    >
      {children}
    </div>
  );
}
